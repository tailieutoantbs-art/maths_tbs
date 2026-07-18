'use client';

import {useRouter, usePathname} from '@/i18n/routing';
import {useLocale} from 'next-intl';
import React from 'react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, {locale: newLocale});
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex bg-white rounded-full shadow-md border border-slate-200 overflow-hidden">
      <button
        onClick={() => handleLocaleChange('vi')}
        className={`px-3 py-1.5 text-xs font-bold transition-colors ${locale === 'vi' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
      >
        VI
      </button>
      <button
        onClick={() => handleLocaleChange('en')}
        className={`px-3 py-1.5 text-xs font-bold transition-colors ${locale === 'en' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
      >
        EN
      </button>
    </div>
  );
}
