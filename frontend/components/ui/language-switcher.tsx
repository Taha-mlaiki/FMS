'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: 'ar' | 'en') {
    if (locale === newLocale) return;
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div 
      className="flex items-center rounded-full p-[3px] border"
      style={{ 
        backgroundColor: '#F9F8F6', 
        borderColor: '#EFEAE0' 
      }}
      dir="ltr"
    >
      <button
        onClick={() => switchLocale('en')}
        className={`px-3 py-1 text-[12px] font-semibold rounded-full transition-all duration-200 ${
          locale === 'en' ? 'bg-white shadow-sm text-[#2D6A4F]' : 'text-[#9C9890] hover:text-[#5C5852]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('ar')}
        className={`px-3 py-1 text-[12px] font-semibold rounded-full transition-all duration-200 ${
          locale === 'ar' ? 'bg-white shadow-sm text-[#2D6A4F]' : 'text-[#9C9890] hover:text-[#5C5852]'
        }`}
      >
        عربي
      </button>
    </div>
  );
}
