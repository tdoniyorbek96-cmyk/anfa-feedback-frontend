import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, cn } from '@/app/components/ui/Shared';
import { ChevronDown, Mic, Square, Trash2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

type RecordingItem = {
  id: string;
  blob: Blob;
  url: string;
  createdAt: number;
};

interface FeedbackViewProps {
  feedback: string;
  setFeedback: (s: string) => void;
  department: string;
  setDepartment: (s: string) => void;

  recordings: RecordingItem[];
  setRecordings: React.Dispatch<React.SetStateAction<RecordingItem[]>>;

  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const DEPARTMENTS = ['reception', 'doctors', 'nursing', 'laboratory', 'cleanliness', 'other'];

function pickAudioMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  for (const c of candidates) {
    // @ts-ignore
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return '';
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(ts: number) {
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
}

export function FeedbackView({
  feedback,
  setFeedback,
  department,
  setDepartment,
  recordings,
  setRecordings,
  onSubmit,
  onBack,
  isSubmitting,
}: FeedbackViewProps) {
  const { t } = useLanguage();

  // Multiple voice recordings (LOGIC SAME)
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState('');

  // UI-only states (no business logic change)
  const [confirmClear, setConfirmClear] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>('');

  // Cleanup: stop mic + revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      recordings.forEach((r) => URL.revokeObjectURL(r.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    setAudioError('');
    setConfirmClear(false);
    if (isSubmitting) return;

    try {
      chunksRef.current = [];
      mimeTypeRef.current = pickAudioMimeType();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = mimeTypeRef.current
        ? new MediaRecorder(stream, { mimeType: mimeTypeRef.current })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type = mimeTypeRef.current || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);

        const item: RecordingItem = {
          id: makeId(),
          blob,
          url,
          createdAt: Date.now(),
        };

        // Add to list (do NOT overwrite old ones)
        setRecordings((prev) => [item, ...prev]);

        // Stop mic tracks
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setAudioError(
        t('voice_permission_error') || 'Mikrofon ruxsati berilmadi yoki qurilma topilmadi.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setAudioError('');
    if (!isRecording) return;
    try {
      mediaRecorderRef.current?.stop();
    } finally {
      setIsRecording(false);
    }
  };

  const removeRecording = (id: string) => {
    setRecordings((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const clearAllRecordings = () => {
    recordings.forEach((r) => URL.revokeObjectURL(r.url));
    setRecordings([]);
    setConfirmClear(false);
  };

  const recordingsCount = recordings.length;

  const subtleGlow = useMemo(() => {
    if (isRecording) return 'shadow-rose-500/20';
    if (recordingsCount > 0) return 'shadow-teal-500/15';
    return 'shadow-black/5';
  }, [isRecording, recordingsCount]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
        >
          {t('back')}
        </button>

        <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {t('step_2')}
        </span>

        <div className="w-8" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('welcome_subtitle')}</h2>

      <div className="space-y-4 flex-1">
        {/* Text feedback */}
        <motion.div
          layout
          className="relative"
          whileHover={{ y: -1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-teal-200/40 via-slate-200/10 to-emerald-200/40 blur opacity-70 pointer-events-none" />
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('feedback_placeholder')}
            className="relative w-full h-40 p-4 bg-white/70 border border-slate-200 rounded-3xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none text-lg shadow-sm"
          />
        </motion.div>

        {/* Voice feedback (WOW UI) */}
        <motion.div
          layout
          className={cn(
            "relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-4 shadow-lg",
            subtleGlow
          )}
        >
          {/* Soft background sparkles when there are recordings */}
          <AnimatePresence>
            {!isRecording && recordingsCount > 0 && (
              <motion.div
                key="sparkles-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <motion.div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-200/20 blur-2xl"
                  animate={{ y: [0, 10, 0], x: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-emerald-200/15 blur-2xl"
                  animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header row */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  "w-10 h-10 rounded-2xl border flex items-center justify-center",
                  isRecording ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"
                )}
                animate={isRecording ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: isRecording ? Infinity : 0, ease: 'easeInOut' }}
              >
                <Mic size={18} className={cn(isRecording ? "text-rose-600" : "text-slate-500")} />
              </motion.div>

              <div>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  {t('voice_feedback_title')}
                  {recordingsCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {recordingsCount}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{t('voice_feedback_hint')}</p>
              </div>
            </div>

            {/* Action button */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <motion.button
                  type="button"
                  onClick={startRecording}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative w-12 h-12 rounded-2xl border flex items-center justify-center transition shadow-sm",
                    "bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:shadow-md",
                    isSubmitting && "opacity-60 cursor-not-allowed"
                  )}
                  aria-label={t('voice_start')}
                  title={t('voice_start')}
                >
                  {/* glow ring */}
                  <span className="absolute inset-0 rounded-2xl bg-teal-400/0 hover:bg-teal-400/5 transition" />
                  <Mic size={28} className="text-slate-700" />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={stopRecording}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative w-12 h-12 rounded-2xl border flex items-center justify-center transition shadow-md",
                    "bg-rose-600 border-rose-600 text-white hover:bg-rose-700",
                    isSubmitting && "opacity-60 cursor-not-allowed"
                  )}
                  aria-label={t('voice_stop') || 'To‘xtatish'}
                  title={t('voice_stop') || 'To‘xtatish'}
                >
                  <Square size={22} className="text-white" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Recording studio panel */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                key="recording-panel"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="relative z-10 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="relative w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <span className="absolute inset-0 rounded-full bg-rose-400/20 animate-ping" />
                      <Mic size={18} className="text-rose-600 relative z-10" />
                    </motion.div>

                    <div>
                      <p className="text-sm font-semibold text-rose-700">{t('voice_recording')}</p>
                      {/* Fake waveform bars (wow effect) */}
                      <div className="mt-1 flex items-center gap-1">
                        {[...Array(14)].map((_, i) => (
                          <motion.span
                            key={i}
                            className="block w-1 rounded-full bg-rose-400/70"
                            animate={{ height: [6, 14, 8, 18, 10] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.03 }}
                            style={{ height: 10 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-rose-600">
                    <Sparkles size={14} />
                    <span>{t('voice_recording')}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {audioError && (
              <motion.p
                key="audio-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="relative z-10 text-red-600 text-xs mt-3 font-medium"
              >
                {audioError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Recordings list (stacked cards + animations) */}
          <AnimatePresence>
            {recordingsCount > 0 && !isRecording && (
              <motion.div
                key="recordings-list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="relative z-10 mt-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 font-medium">
                    {t('voice_ready')} ({recordingsCount})
                  </p>

                  {!confirmClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="text-slate-500 hover:text-slate-700 text-xs font-semibold transition"
                    >
                      {t('remove_all')}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
                      >
                        {t('cancel') || 'Bekor qilish'}
                      </button>
                      <button
                        type="button"
                        onClick={clearAllRecordings}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                      >
                        {t('confirm') || 'Tasdiqlash'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div className="mt-3 space-y-3">
                  {recordings.map((r, idx) => {
                    const number = recordingsCount - idx;
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        className="group relative"
                      >
                        {/* stacked shadow illusion */}
                        <div className="absolute inset-0 rounded-2xl bg-slate-200/20 blur-[10px] -z-10 opacity-0 group-hover:opacity-100 transition" />
                        <div className="bg-white/80 border border-slate-200 rounded-2xl p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                                #{number}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {formatTime(r.createdAt)}
                              </span>
                            </div>

                            <motion.button
                              type="button"
                              onClick={() => removeRecording(r.id)}
                              whileTap={{ scale: 0.97 }}
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center gap-1"
                              aria-label={t('remove')}
                              title={t('remove')}
                            >
                              <Trash2 size={14} />
                              <span className="hidden sm:inline">{t('remove')}</span>
                            </motion.button>
                          </div>

                          <audio controls src={r.url} className="w-full" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 mt-3">{t('voice_will_send')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Department */}
        <motion.div layout className="relative">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none text-base font-medium"
          >
            <option value="" disabled>
              {t('select_department')}
            </option>
            {DEPARTMENTS.map((dep) => (
              <option key={dep} value={dep}>
                {t(`departments.${dep}`)}
              </option>
            ))}
          </select>

          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={20}
          />
        </motion.div>
      </div>

      {/* Submit */}
      <Button
        variant="primary"
        size="lg"
        className="w-full mt-6"
        onClick={onSubmit}
        isLoading={isSubmitting}
        disabled={isSubmitting || isRecording}
      >
        {t('submit_feedback')}
      </Button>
    </motion.div>
  );
}
