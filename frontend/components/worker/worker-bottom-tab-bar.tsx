'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ClipboardList, LayoutDashboard, Mail } from 'lucide-react';

type TabItemDef = {
  key: string;
  href: string;
  icon: React.ElementType;
};

const tabDefs: TabItemDef[] = [
  { key: 'dashboard', href: '/worker/dashboard', icon: LayoutDashboard },
  { key: 'tasks', href: '/worker/tasks', icon: ClipboardList },
  { key: 'invitations', href: '/worker/invitations', icon: Mail },
];

export function WorkerBottomTabBar() {
  const pathname = usePathname();
  const t = useTranslations('sidebar');

  const tabs = tabDefs.map((tab) => ({ ...tab, label: t(tab.key) }));

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 border-t bg-white md:hidden"
      style={{ borderColor: '#E4E0D8', height: '64px' }}
      aria-label="Worker navigation"
    >
      <div className="grid h-full grid-cols-3">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1"
              style={{ color: active ? '#2D6A4F' : '#9C9890' }}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
