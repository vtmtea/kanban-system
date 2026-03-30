import React, { ReactNode } from 'react';

// Icons
export const BellIcon = () => <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
export const QuestionMarkIcon = () => <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const SettingCogIcon = () => <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export function TopNav({ title, CustomCenter }: { title: string; CustomCenter?: ReactNode }) {
  return (
    <header className="h-[88px] flex items-center px-10 bg-[#f8fafc] shrink-0 z-10 w-full relative">
      <div className="w-[250px] shrink-0">
        <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight">{title}</h1>
      </div>
      
      <div className="flex-1 flex justify-start items-center relative">
        {CustomCenter ? CustomCenter : (
          <div className="relative w-full max-w-[340px]">
             <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
             <input type="text" placeholder="Search insights..." className="w-full bg-[#f1f5f9] border-none rounded-full py-2.5 pl-11 pr-4 text-[13px] font-semibold text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#0d6efd]/30 outline-none transition-shadow" />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6 shrink-0 justify-end w-[200px]">
        <button className="text-gray-500 hover:text-gray-900 relative transition-colors">
           <BellIcon />
        </button>
        <button className="text-gray-500 hover:text-gray-900 transition-colors">
           <QuestionMarkIcon />
        </button>
        <button className="text-gray-500 hover:text-gray-900 transition-colors">
           <SettingCogIcon />
        </button>
      </div>
    </header>
  );
}
