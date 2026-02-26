import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MobileContainer } from '@/app/components/ui/Shared';
import { WelcomeView } from '@/app/views/WelcomeView';
import { RatingView } from '@/app/views/RatingView';
import { FeedbackView } from '@/app/views/FeedbackView';
import { AnalyzingView } from '@/app/views/AnalyzingView';
import { ResultView } from '@/app/views/ResultView';
import { Toaster, toast } from 'sonner';
import { LanguageProvider } from '@/app/context/LanguageContext';
import { LanguageSwitcher } from '@/app/components/ui/LanguageSwitcher';

type Step = 'welcome' | 'rating' | 'feedback' | 'analyzing' | 'result';

type RecordingItem = {
  id: string;
  blob: Blob;
  url: string;
  createdAt: number;
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const [step, setStep] = useState<Step>('welcome');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Telegram message edit qilish uchun feedbackId
  const [feedbackId, setFeedbackId] = useState<string>('');

  // ✅ Yangi: audio yozuvlar ro‘yxati (ko‘p dona)
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);

  // Determine if feedback is positive (4 or 5 stars)
  const isPositive = rating >= 4;

  const API_URL = import.meta.env.VITE_API_URL as string | undefined;

  const handleStart = () => setStep('rating');

  const handleRatingSubmit = () => {
    if (rating > 0) {
      setStep('feedback');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!API_URL) {
      toast.error("VITE_API_URL topilmadi. .env faylni tekshiring.");
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ multipart/form-data (text + voices[])
      const form = new FormData();
      form.append('rating', String(rating));
      form.append('comment', feedbackText);
      form.append('department', department);

      // ✅ Audio’larni voices nomi bilan yuboramiz (backend: upload.array("voices"))
      if (recordings.length > 0) {
        recordings.forEach((r, idx) => {
          // File nomi berib yuborsak Telegram’da chiroyliroq ko‘rinadi
          const ext =
            r.blob.type.includes('ogg') ? 'ogg' :
            r.blob.type.includes('webm') ? 'webm' :
            r.blob.type.includes('mp3') ? 'mp3' :
            'webm';

          form.append('voices', r.blob, `voice-${idx + 1}.${ext}`);
        });
      }

      const res = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        body: form,
      });

      const data: any = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || 'Feedback yuborilmadi');
      }

      // ✅ Backend qaytargan feedbackId ni saqlab qo‘yamiz
      if (typeof data?.feedbackId === 'string' && data.feedbackId.length > 0) {
        setFeedbackId(data.feedbackId);
      } else {
        setFeedbackId('');
      }

      // Success flow (old logic preserved)
      setStep('analyzing');

      // Simulate AI analysis time (old behavior preserved)
      setTimeout(() => {
        setStep('result');
      }, 2000);
    } catch (e: any) {
      toast.error(e?.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCall = async (phone: string) => {
    if (!API_URL) {
      toast.error("VITE_API_URL topilmadi. .env faylni tekshiring.");
      return;
    }

    // ✅ feedbackId bo‘lmasa edit qilib bo‘lmaydi
    if (!feedbackId) {
      toast.error("Xatolik: feedbackId topilmadi. Avval feedback yuborilganiga ishonch hosil qiling.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/request-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          phone,
        }),
      });

      const data: any = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || 'So‘rov yuborilmadi');
      }

      toast.success("So‘rov yuborildi! Rahbariyat siz bilan bog‘lanadi.");
    } catch (e: any) {
      toast.error(e?.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileContainer>
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <WelcomeView key="welcome" onStart={handleStart} />
        )}

        {step === 'rating' && (
          <RatingView
            key="rating"
            rating={rating}
            setRating={setRating}
            onNext={handleRatingSubmit}
            onBack={() => setStep('welcome')}
          />
        )}

        {step === 'feedback' && (
          <FeedbackView
            key="feedback"
            feedback={feedbackText}
            setFeedback={setFeedbackText}
            department={department}
            setDepartment={setDepartment}
            // ✅ audio’lar App’da saqlanadi va FeedbackView boshqaradi
            recordings={recordings}
            setRecordings={setRecordings}
            onSubmit={handleFeedbackSubmit}
            onBack={() => setStep('rating')}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 'analyzing' && (
          <AnalyzingView key="analyzing" />
        )}

        {step === 'result' && (
          <ResultView
            key="result"
            isPositive={isPositive}
            onRequestCall={handleRequestCall}
            isSubmittingCall={isSubmitting}
          />
        )}
      </AnimatePresence>

      <Toaster position="top-center" />
    </MobileContainer>
  );
}
