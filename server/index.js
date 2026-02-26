import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import multer from "multer";
import FormData from "form-data";



dotenv.config();

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json());

// ✅ Trust proxy (deploy paytida Nginx/Render/Heroku bo‘lsa kerak bo‘ladi)
app.set("trust proxy", 1);

// ✅ Rate limit: 1 IP -> 1 daqiqada 10 ta so‘rov
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Juda ko‘p urinish. 1 daqiqadan keyin qayta urinib ko‘ring." },
});
app.use("/api", apiLimiter);

// ENV
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, PORT, APP_NAME } = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("❌ Telegram token yoki chat_id yo‘q (.env tekshiring)");
}

/** =======================
 *  PERSISTENT STORE (JSON)
 *  server/data/feedback-map.json
 *  ======================= */
const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "feedback-map.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({}), "utf8");
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(obj) {
  ensureStore();
  const tmp = STORE_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
  fs.renameSync(tmp, STORE_PATH);
}

function upsertFeedbackRecord(feedbackId, record) {
  const store = readStore();
  store[feedbackId] = { ...(store[feedbackId] || {}), ...record };
  writeStore(store);
}

function getFeedbackRecord(feedbackId) {
  const store = readStore();
  return store[feedbackId] || null;
}


/** =======================
 *  BONUS STORE (JSON)
 *  server/data/bonus-store.json
 *  ======================= */
const BONUS_STORE_PATH = path.join(DATA_DIR, "bonus-store.json");

// Bonuslar ID'lari (frontenddagi id bilan bir xil bo‘lsin)
const BONUS_IDS = ["lab10", "uziFree", "doc50", "checkup10"];

function ensureBonusStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BONUS_STORE_PATH)) fs.writeFileSync(BONUS_STORE_PATH, JSON.stringify({}), "utf8");
}

function readBonusStore() {
  ensureBonusStore();
  try {
    const raw = fs.readFileSync(BONUS_STORE_PATH, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeBonusStore(obj) {
  ensureBonusStore();
  const tmp = BONUS_STORE_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
  fs.renameSync(tmp, BONUS_STORE_PATH);
}

// Har safar turli bo‘lib ketmasligi uchun: store yo‘q bo‘lsa random, store bor bo‘lsa o‘sha
function pickBonusId() {
  const idx = Math.floor(Math.random() * BONUS_IDS.length);
  return BONUS_IDS[idx];
}

// IP ni aniq olish (proxy bo‘lsa ham)
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
}





/** =======================
 *  Telegram helpers
 *  ======================= */
async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const { data } = await axios.post(url, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "HTML",
  });

  if (!data.ok) {
    console.error("Telegram error:", data);
    throw new Error("Telegramga yuborilmadi");
  }

  return data.result.message_id;
}

async function editTelegramMessage(messageId, newText) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`;

  const { data } = await axios.post(url, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    message_id: messageId,
    text: newText,
    parse_mode: "HTML",
  });

  if (!data.ok) {
    console.error("Telegram edit error:", data);
    throw new Error("Telegram xabar tahrirlanmadi");
  }
}

/** =======================
 *  MEDIA GROUP (AUDIO) to Telegram
 *  ======================= */

async function sendVoiceToTelegram(buffer, filename, caption, replyToMessageId) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendVoice`;

  const form = new FormData();
  form.append("chat_id", process.env.TELEGRAM_CHAT_ID);
  form.append("voice", buffer, { filename }); // buffer: multer.memoryStorage dan keladi
  if (caption) form.append("caption", caption);
  if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));

  const { data } = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
  });

  if (!data.ok) {
    console.error("Telegram sendVoice error:", data);
    throw new Error("Voice yuborilmadi");
  }

  return data.result.message_id;
}

async function sendAudioGroupToTelegram(files, replyToMessageId) {
  if (!files || files.length === 0) return;

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMediaGroup`;

  // Telegram media group: audio/webm ko‘pincha "voice" bo‘lib ketmaydi,
  // eng barqarori — document qilib yuborish (hamma format o‘tadi)
  const media = files.map((f, idx) => ({
    type: "document",
    media: `attach://file${idx}`,
    filename: f.originalname || `voice-${idx + 1}.webm`,
  }));

  const form = new FormData();
  form.append("chat_id", process.env.TELEGRAM_CHAT_ID);
  if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));
  form.append("media", JSON.stringify(media));

  files.forEach((f, idx) => {
    form.append(`file${idx}`, f.buffer, {
      filename: f.originalname || `voice-${idx + 1}.webm`,
      contentType: f.mimetype || "application/octet-stream",
    });
  });

  const { data } = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
  });

  if (!data.ok) {
    console.error("Telegram mediaGroup error:", data);
    throw new Error("Telegramga audio yuborilmadi");
  }
}

/** =======================
 *  CATEGORY + URGENT + FORMAT
 *  ======================= */
function ratingLabel(rating) {
  const r = Number(rating) || 0;
  if (r <= 2) return "🚨 QIZIL CHIROQ";
  if (r === 3) return "⚠️ SALBIY";
  return "✅ IJOBIY";
}

function isUrgent({ rating, comment }) {
  const r = Number(rating) || 0;
  const text = (comment || "").toLowerCase();

  if (r <= 2) return true;

  const urgentWords = [
    "rahbariyat",
    "shikoyat",
    "sud",
    "prokuratura",
    "janjal",
    "qo'pol",
    "qo‘pol",
    "haqorat",
    "pora",
  ];

  return urgentWords.some((w) => text.includes(w));
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function departmentToTag(department) {
  if (!department || typeof department !== "string") return "";

  return (
    "#" +
    department
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\wа-яёқғўҳ]/gi, "")
  );
}

function formatFeedbackMessage({ rating, department, comment, phone }) {
  const label = ratingLabel(rating);

  const safeDept = escapeHtml(department || "Kiritilmadi");
  const deptTag = departmentToTag(department);

  const safeComment = escapeHtml(comment || "Kiritilmadi");

  const hasPhone = typeof phone === "string" && phone.trim().length > 0;
  const safePhone = hasPhone ? `<b>${escapeHtml(phone.trim())}</b>` : null;
  const phoneLine = safePhone ? `📞 Aloqa: ${safePhone}\n` : "";

  // ✅ Siz xohlaganidek: Anfa Feedback sarlavhasini chiqarib yubormaymiz.
  // APP_NAME ham ishlatilmaydi (bot nomi o‘zi yetarli)
  return `
<b>${label}</b>
⭐ Baho: <b>${Number(rating) || 0}/5</b>
🏥 Bo‘lim: ${safeDept} ${deptTag}
📝 Fikr:
${safeComment}
${phoneLine}`.trim();
}


/** =======================
 *  Upload (multipart) - conditional
 *  ======================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024, // 12MB
    files: 10, // 10 ta audio gacha
  },
});

// multipart bo‘lsa — multer ishlaydi, bo‘lmasa JSON oqimi buzilmaydi ✅
function maybeMultipart(req, res, next) {
  if (req.is("multipart/form-data")) {
    return upload.array("voices", 10)(req, res, next);
  }
  return next();
}

/** =======================
 *  API ENDPOINTS
 *  ======================= */

// 1) Feedback yuborish (TEXT + OPTIONAL MULTI AUDIO):
// - Telegramga 1 marta text yuboradi
// - audio bo‘lsa: bitta media-group qilib reply qiladi
// - feedbackId qaytaradi
app.post("/api/feedback", upload.array("voices", 10), async (req, res) => {
  try {
    // JSON bo‘lsa req.body express.json() dan keladi
    // multipart bo‘lsa req.body multer orqali text fieldlarni beradi
    console.log("FILES:", req.files?.length || 0);
    console.log("BODY:", req.body);
    const { rating, comment, department } = req.body;

    if (!rating) {
      return res.status(400).json({ ok: false, message: "Rating yo‘q" });
    }

    const feedbackId = crypto.randomUUID();

    const message = formatFeedbackMessage({
      rating,
      department,
      comment,
      phone: null,
    });

    // 1) text xabar
    const telegramMessageId = await sendToTelegram(message);

    // store saqlash
    upsertFeedbackRecord(feedbackId, {
      telegramMessageId,
      rating: Number(rating) || 0,
      department: department || "",
      comment: comment || "",
      phone: "",
      urgent: isUrgent({ rating, comment }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2) audio bo‘lsa — bitta album qilib reply qilamiz
    const files = Array.isArray(req.files) ? req.files : [];
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  await sendVoiceToTelegram(
    f.buffer,
    f.originalname || `voice-${i + 1}.ogg`,
    `🎤 Ovozli fikr #${i + 1}`,
    telegramMessageId // reply
  );
}

    return res.json({ ok: true, feedbackId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server xatolik" });
  }
});

// 2) Telefon qo‘shish: YANGI XABAR yubormaydi, oldingi xabarni EDIT qiladi
app.post("/api/request-call", async (req, res) => {
  try {
    const { feedbackId, phone } = req.body;

    if (!feedbackId || typeof feedbackId !== "string") {
      return res.status(400).json({ ok: false, message: "feedbackId kiritilmadi" });
    }

    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ ok: false, message: "Telefon raqam kiritilmadi" });
    }

    const record = getFeedbackRecord(feedbackId);
    if (!record || !record.telegramMessageId) {
      return res.status(404).json({ ok: false, message: "Original xabar topilmadi" });
    }

    const newText = formatFeedbackMessage({
      rating: record.rating,
      department: record.department,
      comment: record.comment,
      phone,
    });

    await editTelegramMessage(record.telegramMessageId, newText);

    upsertFeedbackRecord(feedbackId, {
      phone,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server xatolik" });
  }
});



// ✅ BONUS CLAIM (IP bo‘yicha 1 marta)
app.post("/api/bonus/claim", async (req, res) => {
  try {
    const ip = getClientIp(req);
console.log("BONUS CLAIM IP:", ip, "| req.ip:", req.ip, "| xff:", req.headers["x-forwarded-for"]);

    const store = readBonusStore();

    // ✅ Agar oldin bonus olingan bo‘lsa — qayta ko‘rsatamiz
    if (store[ip]) {
      return res.json({
        ok: true,
        alreadyClaimed: true,
        bonusId: store[ip].bonusId,
        claimedAt: store[ip].claimedAt,
      });
    }

    // ❇️ Birinchi marta — yangi bonus
    const bonusId = pickBonusId();

    store[ip] = {
      bonusId,
      claimedAt: new Date().toISOString(),
      ua: req.headers["user-agent"] || "",
    };

    writeBonusStore(store);

    return res.json({
      ok: true,
      alreadyClaimed: false,
      bonusId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      message: "Server xatolik",
    });
  }
});


app.post("/api/bonus/claim", (req, res) => {
  try {
    const ip = normalizeIp(getClientIp(req));
    const store = readBonusStore();

    console.log("BONUS CLAIM IP:", ip, "| req.ip:", req.ip, "| xff:", req.headers["x-forwarded-for"]);

    // ✅ oldin olgan bo‘lsa — o‘sha bonusni qaytaradi
    if (store[ip]) {
      return res.json({
        ok: true,
        alreadyClaimed: true,
        bonusId: store[ip].bonusId,
        claimedAt: store[ip].claimedAt,
      });
    }

    // ✅ birinchi marta — yangi bonus
    const bonusId = pickBonusId();

    store[ip] = {
      bonusId,
      claimedAt: new Date().toISOString(),
      ua: req.headers["user-agent"] || "",
    };

    writeBonusStore(store);

    return res.json({
      ok: true,
      alreadyClaimed: false,
      bonusId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server xatolik" });
  }
});




// Health check
app.get("/health", (_, res) => {
  res.json({ ok: true });
});

// Server start
app.listen(PORT || 3001, () => {
  console.log(`✅ Backend ishga tushdi: http://localhost:${PORT || 3001}`);
});
