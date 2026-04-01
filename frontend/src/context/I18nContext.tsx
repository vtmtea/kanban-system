import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultLocale, messages, type Locale } from '@/i18n/messages';

const localeStorageKey = 'kanban.locale';

type MessageValues = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: MessageValues) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit, numeric?: Intl.RelativeTimeFormatNumeric) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function normalizeLocale(value?: string | null): Locale {
  if (!value) return defaultLocale;
  return value.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}

function resolveInitialLocale() {
  if (typeof window === 'undefined') return defaultLocale;

  const stored = window.localStorage.getItem(localeStorageKey);
  if (stored) {
    return normalizeLocale(stored);
  }

  return normalizeLocale(window.navigator.language);
}

function interpolate(template: string, values?: MessageValues) {
  if (!values) return template;

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    return key in values ? String(values[key]) : '';
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(localeStorageKey, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale: setLocaleState,
    t: (key, values) => {
      const template = messages[locale][key] || messages['en-US'][key] || messages['zh-CN'][key] || key;
      return interpolate(template, values);
    },
    formatDate: (value, options) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    formatRelativeTime: (value, unit, numeric = 'auto') =>
      new Intl.RelativeTimeFormat(locale, { numeric }).format(value, unit),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
