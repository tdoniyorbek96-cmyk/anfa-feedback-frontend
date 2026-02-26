import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/Shared';
import {
  CheckCircle2,
  HeartHandshake,
  MapPin,
  Instagram,
  Youtube,
  Phone,
  Lock,
  Gift,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

interface ResultViewProps {
  isPositive: boolean;
  onRequestCall: (phone: string) => void;
  isSubmittingCall?: boolean;
}

export function ResultView({ isPositive, onRequestCall, isSubmittingCall }: ResultViewProps) {
  if (isPositive) {
    return <PositiveResult />;
  }
  return <NegativeResult onSubmit={onRequestCall} isSubmitting={isSubmittingCall} />;
}

/**
 * ✅ NEW PREMIUM (frontend-only)
 * - Bonus only unlocks after user opens 1 of 3 review links
 * - 4 bonuses (your list)
 * - A-variant: user taps 1 of 3 cards -> internal random chooses actual bonus
 * - success sound on bonus reveal (optional)
 * - Does NOT break existing translations: uses t() where possible, fallback otherwise
 */
function PositiveResult() {
  const { t } = useLanguage();

  const API_URL = import.meta.env.VITE_API_URL as string | undefined;

  // gate: must click at least one review link
  const [hasVisitedReview, setHasVisitedReview] = useState(false);

  // flow: locked -> unlocked -> opened
  const [bonusState, setBonusState] = useState<'locked' | 'unlocked' | 'opened'>('locked');

  // card UI (A variant)
  const [pickedCard, setPickedCard] = useState<number | null>(null);

  // final selected bonus id
  const [selectedBonusId, setSelectedBonusId] = useState<string | null>(null);

  const BONUS_LOCK_KEY = 'anfa_bonus_claimed_v1';

  // success audio
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Your bonuses (4)
  const BONUSES = useMemo(
    () => [
      { id: 'lab10', title: t('bonus.lab10') },
      { id: 'uziFree', title: t('bonus.uziFree') },
      { id: 'doc50', title: t('bonus.doc50') },
      { id: 'checkup10', title: t('bonus.checkup10') },
    ],
    []
  );

  const handlePlatformClick = () => {
    if (!hasVisitedReview) setHasVisitedReview(true);
    if (bonusState === 'locked') setBonusState('unlocked');
  };

  const playSuccessSound = () => {
    try {
      if (!successAudioRef.current) {
        successAudioRef.current = new Audio('/sounds/success.mp3');
        successAudioRef.current.volume = 0.6;
      }
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch(() => {});
    } catch {}
  };

  const pickRandomBonus = () => {
    // "non-boring random" (time + random)
    const seed = Date.now() + Math.floor(Math.random() * 1e9);
    const idx = seed % BONUSES.length;
    return BONUSES[idx];
  };

  const openBonusByCard = async (cardIndex: number) => {
  if (!hasVisitedReview || bonusState !== 'unlocked') return;

  // ✅ agar localStorage lock bo‘lsa — backenddan avvalgi bonusni olib ko‘rsatamiz
  setPickedCard(cardIndex);

  try {
    const res = await fetch(`${API_URL}/api/bonus/claim`, { method: 'POST' });
    const data: any = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) throw new Error(data?.message || 'Bonus claim error');

    // ✅ doim backend qaytargan bonusId ishlatiladi
    const bonusId = data?.bonusId as string;

    setTimeout(() => {
      setSelectedBonusId(bonusId);
      setBonusState('opened');
      playSuccessSound();
      localStorage.setItem(BONUS_LOCK_KEY, '1'); // optional, UI lock
    }, 650);
  } catch (e) {
    // xohlasangiz toast chiqaring
    console.error(e);
  }
};

  const getBonusTitle = () => {
    const found = BONUSES.find((b) => b.id === selectedBonusId);
    return found?.title || '';
  };

  // 🔥 When opened => show premium bonus result
  if (bonusState === 'opened' && selectedBonusId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col p-6 text-center items-center justify-center h-full relative overflow-hidden"
      >
        {/* Luxury background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
          <motion.div
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl bg-white/30"
            animate={{ x: [0, 18, 0], y: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-28 -right-24 w-80 h-80 rounded-full blur-3xl bg-white/20"
            animate={{ x: [0, -16, 0], y: [0, -10, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mb-8 relative shadow-inner">
            <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
            <Gift size={48} className="text-amber-600 relative z-10" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            {t('bonus.won_title') || 'Bonus ochildi!'}
          </h2>

          <div className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl p-6 mb-4 shadow-xl shadow-black/5 relative overflow-hidden">
            {/* shimmer */}
            <motion.div
              className="absolute -left-24 top-0 w-48 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-12"
              animate={{ x: [-120, 560] }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
            <p className="relative z-10 text-xl font-bold text-slate-900 leading-relaxed">
              {getBonusTitle()}
            </p>
          </div>

          <p className="text-slate-500 font-medium px-2 leading-relaxed mb-6">
            {t('bonus.won_msg') || 'Bonus klinika tomonidan qabulda tasdiqlanadi.'}
          </p>

          <div className="w-full flex justify-center">
            <Button
              variant="primary"
              className="rounded-2xl py-5 font-bold px-10"
              onClick={() => window.location.reload()}
            >
              {t('bonus.finish') || 'Tugatish'}
            </Button>
            
          </div>
        </div>
      </motion.div>
    );
  }

  // ✅ default positive screen
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col p-6 text-center relative overflow-hidden"
    >
      {/* Luxury background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <motion.div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl bg-white/30"
          animate={{ x: [0, 18, 0], y: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-28 -right-24 w-80 h-80 rounded-full blur-3xl bg-white/20"
          animate={{ x: [0, -16, 0], y: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white/70 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/5">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>

        {/* Reviews */}
        <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl p-6 mb-6 mt-6 shadow-xl shadow-black/5">

          <p className="text-sm text-slate-600 font-medium mb-4">
            {hasVisitedReview ? t('bonus.review_done') : t('bonus.review_cta')}
          </p>

          <div className="grid grid-cols-1 gap-3">
            <SocialButton
              onClick={handlePlatformClick}
              icon={
                  <img
                    src="/platforms/google.png"
                    alt="Google Maps"
                    className="w-7 h-7 object-contain"
                  />
              }
              label="Google Maps"
              href="https://www.google.com/maps/place/ANFA+CLINIC+(%D0%90%D0%9D%D0%A4%D0%90+%D0%9A%D0%9B%D0%98%D0%9D%D0%98%D0%9A)/@41.3607309,69.2809929,17z/data=!4m8!3m7!1s0x38ae8ddaad6ffe8d:0x852c5599e99958ca!8m2!3d41.3607269!4d69.2835678!9m1!1b1!16s%2Fg%2F11hs_zmrq5"
            />
            <SocialButton
              onClick={handlePlatformClick}
              icon={
                <img
                  src="/platforms/yandex.png"
                  alt="Yandex Maps"
                  className="w-7 h-7 object-contain"
                />
              }
              label="Yandex Maps"
              href="https://yandex.uz/maps/org/76418939998/reviews/?ll=69.283546%2C41.360671&tab=reviews&z=17.06"
            />
            <SocialButton
              onClick={handlePlatformClick}
              icon={
                <img
                  src="/platforms/2gis.png"
                  alt="2GIS"
                  className="w-7 h-7 object-contain"
                />
              }
              label="2GIS"
              href="https://2gis.uz/uz/tashkent/firm/70000001050574984/tab/reviews?m=69.283615%2C41.360745%2F16"
            />
          </div>
        </div>

        {/* ✅ Bonus Section (Premium cards) */}
        <div className="w-full max-w-md mb-6">
          <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-widest">
            {t('bonus.section_title')}
          </h3>

          {bonusState === 'locked' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl p-5 text-left shadow-lg shadow-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t('bonus.locked_title') || 'Bonus yopiq'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('bonus.locked_hint') || 'Bonus ochilishi uchun yuqoridagi saytlardan bittasiga kiring.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {bonusState === 'unlocked' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-3"
            >
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openBonusByCard(i)}
                  disabled={!hasVisitedReview}
                  className={[
                    'relative rounded-3xl p-4 text-left border transition-all duration-300 overflow-hidden',
                    'bg-white/70 backdrop-blur-md border-white/60 shadow-lg shadow-black/5',
                    !hasVisitedReview ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-black/10 hover:-translate-y-[1px]',
                    pickedCard === i ? 'ring-2 ring-amber-300/70' : '',
                  ].join(' ')}
                  aria-label={`Bonus card ${i + 1}`}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-200/20 blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-slate-200/20 blur-2xl" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center justify-center gap-2 min-h-[86px]">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Gift size={18} className="text-slate-700" />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest text-center w-full">
                      PREMIUM BONUS
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {bonusState === 'unlocked' && (
            <p className="text-[11px] text-slate-400 mt-3">
              Kartalardan birini bosing — bonus random tanlanadi.
            </p>
          )}
        </div>

        {/* Follow us */}
        <div className="w-full max-w-md border-t border-slate-200/60 pt-4 mt-2">
          <h3 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-widest">
            {t('follow_us')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <SocialButton icon={<Instagram className="text-pink-600" />} label="Instagram" href="#" small />
            <SocialButton icon={<Youtube className="text-red-600" />} label="YouTube" href="#" small />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BonusResultView({ bonusIndex }: { bonusIndex: number }) {
  // ❗ old function left to avoid breaking other references (not used now)
  const { t } = useLanguage();
  const bonusKeys = ['bonus_1', 'bonus_2', 'bonus_3'];
  const bonusTitle = t(bonusKeys[bonusIndex] as any);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col p-6 text-center items-center justify-center h-full"
    >
      <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mb-8 relative shadow-inner">
        <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
        <Gift size={48} className="text-amber-600 relative z-10" />
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-6">
        {t('bonus.won_title')}
      </h2>

      <div className="w-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-8 mb-6 shadow-sm">
        <p className="text-xl font-bold text-teal-800 leading-relaxed">
          {bonusTitle}
        </p>
      </div>

      <p className="text-slate-500 font-medium px-4 leading-relaxed">
        {t('bonus.won_msg')}
      </p>
    </motion.div>
  );
}

function BonusCard({ title, isLocked }: { title: string; isLocked: boolean }) {
  // ❗ old component left to avoid breaking other references (not used now)
  return (
    <div
      className={`
      relative p-4 bg-white border border-slate-200 rounded-xl transition-all duration-500
      ${isLocked ? 'opacity-60 blur-[1px] select-none' : 'opacity-100 shadow-sm border-teal-100 bg-teal-50/30'}
    `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
          w-10 h-10 rounded-full flex items-center justify-center shrink-0
          ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-teal-100 text-teal-600'}
        `}
        >
          {isLocked ? <Lock size={18} /> : <Gift size={18} />}
        </div>
        <span className={`text-sm font-medium text-left ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
          {title}
        </span>
      </div>
    </div>
  );
}

/** ✅ FIXED PHONE INPUT:
 *  state => only 9 digits (AA BBB CC DD)
 *  UI    => +998 AA BBB-CC-DD
 *  backspace => fully deletes digits (no stuck prefix)
 */
function NegativeResult({ onSubmit, isSubmitting }: { onSubmit: (phone: string) => void; isSubmitting?: boolean }) {
  const { t } = useLanguage();

  // store ONLY 9 digits after +998 (e.g. "945663424")
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');

  const formatPhone = (d: string) => {
    const only = (d || '').replace(/\D/g, '').slice(0, 9);

    const p1 = only.slice(0, 2);
    const p2 = only.slice(2, 5);
    const p3 = only.slice(5, 7);
    const p4 = only.slice(7, 9);

    let res = '+998';
    if (p1) res += ` ${p1}`;
    if (p2) res += ` ${p2}`;
    if (p3) res += `-${p3}`;
    if (p4) res += `-${p4}`;

    return res;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');

    // If user pastes full number including 998, keep only last 9 digits after 998
    if (raw.startsWith('998')) {
      setDigits(raw.slice(3, 12));
    } else {
      // Otherwise keep at most 9 digits (AA BBB CC DD)
      setDigits(raw.slice(0, 9));
    }

    setError('');
  };

  const handleSubmit = () => {
    if (digits.length === 0) {
      // allowed: empty (user doesn't want to share)
      onSubmit('');
      return;
    }

    if (digits.length !== 9) {
      setError('Telefon raqamni to‘liq kiriting: +998 ** ***-**-**');
      return;
    }

    const formatted = formatPhone(digits);
    onSubmit(formatted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col p-6 text-center"
    >
      <div className="flex-1 flex flex-col items-center justify-center pt-8">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <HeartHandshake size={40} className="text-amber-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {t('negative_title')}
        </h2>

        <div className="w-full bg-slate-50 rounded-3xl p-6 mb-6 text-left mt-6">
          <p className="text-sm text-slate-600 mb-4 font-medium">
            {t('support_msg')}
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="sr-only">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="phone"
                  type="tel"
                  value={formatPhone(digits)}
                  onChange={handlePhoneChange}
                  placeholder={t('phone_placeholder')}
                  className={`w-full h-12 pl-12 pr-4 rounded-xl border focus:ring-2 focus:outline-none bg-white transition-all font-mono text-base ${
                    error ? 'border-red-400 ring-red-400/20 text-red-600' : 'border-slate-200 focus:ring-teal-500 text-slate-800'
                  }`}
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-2 pl-1 font-medium"
                >
                  {error}
                </motion.p>
              )}
              <p className="text-xs text-slate-400 mt-2 pl-1">
                {t('phone_optional')}
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full rounded-xl"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {t('request_call')}
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-auto pb-4">
        {t('feedback_sent')}
      </p>
    </motion.div>
  );
}

function SocialButton({
  icon,
  label,
  href,
  small,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  small?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`flex items-center justify-center gap-3 bg-white border border-slate-100 shadow-sm rounded-xl hover:bg-slate-50 transition-colors ${
        small ? 'p-3' : 'p-4'
      }`}
    >
      {icon}
      <span className="font-medium text-slate-700">{label}</span>
    </a>
  );
}
