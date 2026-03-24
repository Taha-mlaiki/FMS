'use client';

import { usePathname } from 'next/navigation';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUiStore } from '@/lib/stores/ui.store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface TopbarProps {
  actions?: React.ReactNode;
}

export function Topbar({ actions }: TopbarProps) {
  const pathname = usePathname();
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const t = useTranslations('topbar');

  const pageTitles: Record<string, string> = {
    '/owner/dashboard': t('dashboard'),
    '/owner/tasks': t('tasks'),
    '/owner/groups': t('groups'),
    '/owner/stock': t('stock'),
    '/owner/stock/transactions': t('stockTransactions'),
    '/owner/reports': t('reports'),
    '/owner/workers': t('workers'),
    '/owner/settings': t('farmSettings'),
    '/owner/profile': t('profile'),
  };

  // Get the page title from the pathname
  const title = pageTitles[pathname] || t('dashboard');

  // Build breadcrumb for detail pages
  const isDetailPage = pathname.match(/\/(groups|tasks|stock|reports)\/[^/]+/);

  return (
    <header
      className="h-16 flex items-center px-8 sticky top-0 z-30"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E4E0D8',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[#F0EDE4]"
          style={{ color: '#5C5852' }}
          title={
            isSidebarCollapsed ? t('openSidebar') : t('closeSidebar')
          }
        >
          {isSidebarCollapsed ? (
            <PanelRightOpen className="w-5 h-5" />
          ) : (
            <PanelRightClose className="w-5 h-5" />
          )}
        </button>

        {isDetailPage ? (
          <div
            className="flex items-center gap-2 text-[13px]"
            style={{ color: '#9C9890' }}
          >
            <span>
              {
                pageTitles[
                  `/${pathname.split('/')[1]}/${pathname.split('/')[2]}`
                ]
              }
            </span>
            <span>/</span>
            <span style={{ color: '#2C2A24' }}>{t('details')}</span>
          </div>
        ) : (
          <h1 className="font-display text-[24px]" style={{ color: '#2C2A24' }}>
            {title}
          </h1>
        )}
      </div>

      {/* Actions & Language Switcher */}
      <div className="flex items-center gap-4">
        {actions && <div className="flex items-center gap-3">{actions}</div>}
        <LanguageSwitcher />
      </div>
    </header>
  );
}

