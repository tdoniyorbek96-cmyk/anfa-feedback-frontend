import { motion } from 'motion/react';
import { Logo } from '@/app/components/ui/Logo';
import { Button } from '@/app/components/ui/Shared';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

interface WelcomeViewProps {
  onStart: () => void;
}

export function WelcomeView({ onStart }: WelcomeViewProps) {
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <Logo />
      
      <div className="space-y-4 max-w-xs mx-auto mb-12">
        <h2 className="text-2xl font-bold text-slate-800">
          {t('welcome_title')}
        </h2>
        <p className="text-slate-500 text-lg leading-relaxed">
          {t('welcome_subtitle')}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full rounded-2xl shadow-teal-200 shadow-lg"
          onClick={onStart}
        >
          {t('leave_feedback')}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <ShieldCheck size={16} />
          <span>{t('confidential')}</span>
        </div>
      </div>
    </motion.div>
  );
}
