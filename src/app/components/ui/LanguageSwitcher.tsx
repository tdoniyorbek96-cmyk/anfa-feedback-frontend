import { useLanguage } from '@/app/context/LanguageContext';
import { cn } from '@/app/components/ui/Shared';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const languages: { code: 'uz' | 'ru' | 'kz'; label: string }[] = [
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
    { code: 'kz', label: 'KZ' },
  ];

  return (
    <div className={cn("flex bg-slate-100 rounded-lg p-1", className)}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={cn(
            "px-3 py-1.5 text-sm font-semibold rounded-md transition-all",
            language === lang.code
              ? "bg-white text-teal-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
