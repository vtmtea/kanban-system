import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useI18n } from '@/context/I18nContext';

// Icons
export const BellIcon = () => <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
export const QuestionMarkIcon = () => <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const SettingCogIcon = () => <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export function TopNav({
  title,
  CustomCenter,
  searchPlaceholder,
}: {
  title: string;
  CustomCenter?: ReactNode;
  searchPlaceholder?: string;
}) {
  const { t } = useI18n();
  const resolvedSearchPlaceholder = searchPlaceholder || t('common.searchInsights');

  return (
    <header className="flex h-[96px] w-full shrink-0 items-center border-b border-[#e6edf5] bg-[#f7fbff] px-8 md:px-10">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[18px] font-extrabold tracking-tight text-[#111827] md:text-[20px]">{title}</h1>
      </div>

      <div className="hidden flex-[1.1] justify-center px-8 lg:flex">
        {CustomCenter ? CustomCenter : (
          <label className="relative block w-full max-w-[320px] xl:max-w-[360px]">
            <svg className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa0ba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={resolvedSearchPlaceholder}
              className="h-11 w-full rounded-2xl border border-transparent bg-[#eaf1f8] pl-14 pr-4 text-[14px] font-medium text-[#314155] placeholder:text-[#74859c] outline-none transition focus:border-[#c9d7e6] focus:bg-white"
            />
          </label>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <LanguageToggle className="hidden lg:inline-flex" />
        <button
          type="button"
          aria-label={t('topnav.notifications')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#687a92] transition hover:bg-white hover:text-[#111827]"
        >
          <BellIcon />
        </button>
        <button
          type="button"
          aria-label={t('topnav.help')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#687a92] transition hover:bg-white hover:text-[#111827]"
        >
          <QuestionMarkIcon />
        </button>
        <Link
          to="/settings"
          aria-label={t('topnav.settings')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#687a92] transition hover:bg-white hover:text-[#111827]"
        >
          <SettingCogIcon />
        </Link>
      </div>
    </header>
  );
}
