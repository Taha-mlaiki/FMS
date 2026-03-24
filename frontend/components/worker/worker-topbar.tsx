'use client';

import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslations } from 'next-intl';

export function WorkerTopbar() {
  const pathname = usePathname();
  const t = useTranslations('topbar');

  const titleMap: Record<string, string> = {
    '/worker/dashboard': t('workerDashboard'),
    '/worker/tasks': t('workerTasks'),
    '/worker/invitations': t('workerInvitations'),
  };

  function getTopbarState(p: string): { title: string; breadcrumb?: string } {
    // Strip locale prefix (e.g., /ar/worker/dashboard -> /worker/dashboard)
    const clean = p.replace(/^\/(ar|en)/, '');
    const directTitle = titleMap[clean];
    if (directTitle) return { title: directTitle };
    return { title: t('workerSpace') };
  }
  const { title, breadcrumb } = getTopbarState(pathname ?? '');

  return (
    <header
      className="flex h-16 items-center justify-between border-b bg-white px-8"
      style={{ borderColor: '#E4E0D8' }}
    >
      <div className="flex flex-col">
        <h1
          className="font-display text-[24px] leading-7"
          style={{ color: '#2C2A24' }}
        >
          {title}
        </h1>
        {breadcrumb ? (
          <p className="text-[13px]" style={{ color: '#9C9890' }}>
            {breadcrumb}
          </p>
        ) : null}
      </div>
      <div id="worker-topbar-actions" className="flex items-center gap-4">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
