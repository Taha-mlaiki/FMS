'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Sprout } from 'lucide-react';

export function Footer() {
  const t = useTranslations('landing.footer');
  const tNav = useTranslations('landing.nav');

  const productLinks = [
    { label: tNav('features'), href: '#features' },
    { label: tNav('tasks'), href: '#tasks' },
    { label: tNav('stock'), href: '#stock' },
  ];

  const companyLinks = [
    { label: t('aboutUs'), href: '#about' },
    { label: t('careers'), href: '#' },
    { label: t('blog'), href: '#' },
    { label: t('contact'), href: '#' },
  ];

  const legalLinks = [
    { label: t('privacy'), href: '#' },
    { label: t('terms'), href: '#' },
    { label: t('cookies'), href: '#' },
  ];

  return (
    <footer className="relative border-t border-border/50 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 lg:py-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Smart<span className="text-brand-500">Kouri</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('description')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('product')}</h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('company')}</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('legal')}</h3>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/50 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{t('copyright')}</p>
          <div className="flex items-center gap-4">
            {/* Social icons placeholder */}
            {['X', 'LinkedIn', 'GitHub'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
