import { localeLabels, type Locale } from '@/i18n/messages';
import { useI18n } from '@/context/I18nContext';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const locales: Locale[] = ['zh-CN', 'en-US'];

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-2xl border border-[#d9e3ef] bg-white/90 p-1 shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${className}`}
      aria-label={t('common.language')}
      role="group"
    >
      {locales.map((item) => {
        const active = item === locale;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(item)}
            className={`rounded-xl px-3 py-2 text-[12px] font-extrabold transition ${
              active ? 'bg-[#0f4fe6] text-white shadow-[0_10px_18px_rgba(15,79,230,0.2)]' : 'text-[#5b6b80] hover:text-[#162231]'
            }`}
          >
            {localeLabels[item]}
          </button>
        );
      })}
    </div>
  );
}
