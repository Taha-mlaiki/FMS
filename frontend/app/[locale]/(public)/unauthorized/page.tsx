'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function UnauthorizedPage() {
  const t = useTranslations('unauthorized');

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: '#F0EDE4' }}
    >
      <div className="w-full max-w-[480px]">
        <div
          className="overflow-hidden rounded-[24px] bg-white text-center"
          style={{
            boxShadow:
              '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
          }}
        >
          <div
            className="flex h-20 items-center justify-center"
            style={{ backgroundColor: '#0D2818' }}
          >
            <span className="text-[32px]">🔒</span>
          </div>

          <div className="space-y-4 p-10">
            <h1
              className="font-display text-[28px] font-semibold"
              style={{ color: '#2C2A24' }}
            >
              {t('title')}
            </h1>
            <p className="text-[15px]" style={{ color: '#5C5852' }}>
              {t('message')}
            </p>

            <div style={{ borderTop: '1px solid #E4E0D8' }} />

            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="flex h-[48px] items-center justify-center rounded-[10px] text-[15px] font-semibold text-white"
                style={{ backgroundColor: '#2D6A4F' }}
              >
                {t('loginAgain')}
              </Link>
              <Link
                href="/"
                className="flex h-[48px] items-center justify-center rounded-[10px] border text-[15px] font-medium"
                style={{ color: '#2D6A4F', borderColor: '#2D6A4F' }}
              >
                {t('backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
