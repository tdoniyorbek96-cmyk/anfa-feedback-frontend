import { motion } from 'motion/react';
import { useLanguage } from '@/app/context/LanguageContext';

export function AnalyzingView() {
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-75" />
        <div className="absolute inset-0 bg-teal-50 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-slate-800 animate-pulse">
        {t('analyzing')}
      </h2>
    </motion.div>
  );
}
