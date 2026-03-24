import { getTranslations } from 'next-intl/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('auth.layout');

  return (
    <div className="flex min-h-screen h-screen overflow-hidden" dir="rtl">
      {/* Right Panel (RTL) — Dark Brand Panel (58%) */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col items-center justify-center text-center"
        style={{
          backgroundColor: '#0D2818',
          backgroundImage: `
                        radial-gradient(ellipse 600px 400px at 20% 30%, rgba(45,106,79,0.15), transparent),
                        radial-gradient(ellipse 500px 500px at 80% 70%, rgba(27,67,50,0.2), transparent),
                        radial-gradient(ellipse 300px 300px at 50% 50%, rgba(82,183,136,0.08), transparent)
                    `,
        }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo mark */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4C24 4 8 16 8 28C8 36.837 15.163 44 24 44C32.837 44 40 36.837 40 28C40 16 24 4 24 4Z"
              fill="#F4A261"
            />
            <path
              d="M24 12C24 12 16 20 16 28C16 32.418 19.582 36 24 36C28.418 36 32 32.418 32 28C32 20 24 12 24 12Z"
              fill="#0D2818"
            />
          </svg>

          {/* App name */}
          <h1
            className="font-display text-[64px] leading-none"
            style={{ color: '#D8F3DC' }}
          >
            FMS
          </h1>

          {/* Tagline */}
          <p
            className="text-[16px] uppercase tracking-[0.12em]"
            style={{ color: '#52B788' }}
          >
            {t('tagline')}
          </p>

          {/* Divider */}
          <div className="w-20 h-px" style={{ backgroundColor: '#1B4332' }} />

          {/* Feature bullets */}
          <div
            className="flex flex-col items-center gap-2 text-[13px]"
            style={{ color: '#52B788' }}
          >
            <span>✦ {t('feature1')}</span>
            <span>✦ {t('feature2')}</span>
            <span>✦ {t('feature3')}</span>
          </div>
        </div>

        {/* Copyright */}
        <p
          className="absolute bottom-6 text-[12px]"
          style={{ color: '#1B4332' }}
        >
          {t('copyright')}
        </p>
      </div>

      {/* Left Panel (RTL) — Light Form Panel (42%) */}
      <div
        className="flex-1 lg:w-[42%] flex items-center justify-center p-6 lg:p-12"
        style={{ backgroundColor: '#FAFAF7' }}
      >
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
