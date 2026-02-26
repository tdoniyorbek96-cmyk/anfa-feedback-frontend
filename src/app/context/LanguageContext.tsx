import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/app/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['uz'] | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('uz');

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === 'ru') {
      setLanguage('ru');
    } else if (browserLang === 'kk' || browserLang === 'kz') {
      setLanguage('kz');
    } else {
      setLanguage('uz'); // Default to Uzbek
    }
  }, []);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
