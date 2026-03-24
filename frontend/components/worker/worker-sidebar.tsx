'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTaskCount } from '@/lib/hooks/api/use-occurrences';
import { setUserRoleCookie } from '@/lib/auth-role-cookie';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePreferencesStore } from '@/lib/stores/preferences.store';
import { useLogout } from '@/lib/hooks/use-auth';

type NavItemDef = {
  key: string;
  href: string;
  icon: React.ElementType;
  showBadge?: boolean;
};

const navItemDefs: NavItemDef[] = [
  { key: 'dashboard', href: '/worker/dashboard', icon: LayoutDashboard },
  {
    key: 'tasks',
    href: '/worker/tasks',
    icon: ClipboardList,
    showBadge: true,
  },
  { key: 'invitations', href: '/worker/invitations', icon: Mail },
];

function parseCount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'object') return 0;
  const record = value as Record<string, unknown>;

  if (typeof record.count === 'number') return record.count;
  if (typeof record.total === 'number') return record.total;

  const data = record.data;
  if (data && typeof data === 'object') {
    const nestedCount = (data as Record<string, unknown>).count;
    if (typeof nestedCount === 'number') return nestedCount;
  }

  return 0;
}

export function WorkerSidebar() {
  const fullPathname = usePathname();
  const pathname = fullPathname.replace(/^\/(ar|en)(\/|$)/, '$2') || '/';
  const cleanPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [isFarmMenuOpen, setIsFarmMenuOpen] = useState(false);
  const t = useTranslations('sidebar');
  const tc = useTranslations('common');

  const { farmId, farms, farm, role, userId, user } = useFarmContext();
  const taskCountQuery = useTaskCount({
    status: 'todo,pending',
    worker_id: userId ?? undefined,
  });

  const navItems = navItemDefs.map((item) => ({
    ...item,
    label: t(item.key),
  }));

  const taskCount = parseCount(taskCountQuery.data);
  const fullName =
    user?.full_name?.trim() ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.email ||
    tc('worker');

  const initials = fullName.charAt(0).toUpperCase();
  const activeRole = (role ?? 'WORKER').toUpperCase();

  const farmRows = useMemo(
    () =>
      farms.map((farmItem) => ({
        id: farmItem.id,
        name: farmItem.name,
        role: String(farmItem.role ?? ''),
        active: farmItem.id === farmId,
      })),
    [farmId, farms],
  );

  async function handleSwitchFarm(nextFarmId: string) {
    if (!nextFarmId || nextFarmId === farmId) {
      setIsFarmMenuOpen(false);
      return;
    }

    const selectedFarm = farms.find((item) => item.id === nextFarmId);
    setUserRoleCookie(selectedFarm?.role ?? 'WORKER');
    useAuthStore
      .getState()
      .setActiveFarm(nextFarmId, selectedFarm?.role ?? 'WORKER');
    usePreferencesStore.getState().setLastActiveFarmId(nextFarmId);
    await queryClient.invalidateQueries();
    router.push('/worker/dashboard');
    setIsFarmMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <aside
      className="hidden md:flex flex-col h-screen shrink-0 w-[280px] z-40 transition-all duration-300 border-r rtl:border-l rtl:border-r-0 justify-between"
      style={{
        backgroundColor: '#0D2818',
        borderColor: '#1B4332',
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Farm Switcher */}
        <div
          className="p-3 border-b shrink-0"
          style={{ borderColor: '#1B4332' }}
        >
          <Popover open={isFarmMenuOpen} onOpenChange={setIsFarmMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setIsFarmMenuOpen(!isFarmMenuOpen)}
                className="flex items-center w-full rounded-xl p-2 gap-3 transition-colors duration-200 hover:bg-[#1B4332] cursor-pointer outline-none text-left rtl:text-right"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-display transition-transform hover:scale-105 shadow-sm bg-[#2D6A4F]">
                  <span className="text-white text-[16px]">🌿</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate leading-tight mb-0.5">
                    {farm?.name ?? t('chooseFarm')}
                  </p>
                  <span className="inline-flex rounded-full bg-[#D8F3DC] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1B4332]">
                    {activeRole}
                  </span>
                </div>
                <ChevronsUpDown
                  className={`w-4 h-4 text-[#9C9890] transition-transform duration-200 ${
                    isFarmMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[240px] rounded-[16px] p-2 z-50 rtl:text-right"
              align="start"
              sideOffset={8}
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
              }}
            >
              <div className="px-3 py-2">
                <p className="text-[13px] font-semibold text-[#2C2A24]">
                  {t('currentFarm') || tc('farm')}
                </p>
                <p className="text-[12px] text-[#5C5852] truncate">
                  {farm?.name ?? t('chooseFarm')}
                </p>
              </div>
              <div className="my-1 h-px bg-[#E4E0D8]" />
              {farmRows.length === 0 && (
                <p className="px-3 py-2 text-[13px] text-[#5C5852]">
                  {tc('noFarms')}
                </p>
              )}
              {farmRows.map((farmRow) => (
                <button
                  key={farmRow.id}
                  onClick={() => void handleSwitchFarm(farmRow.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[8px] w-full text-right transition-colors cursor-pointer ${
                    farmRow.active ? 'bg-[#F0FAF3]' : 'hover:bg-[#FAFAF7]'
                  }`}
                >
                  <span className="text-[14px] font-medium flex-1 text-[#2C2A24] text-left rtl:text-right">
                    {farmRow.name}
                    <span className="block text-[12px] font-normal text-[#5C5852]">
                      {farmRow.role || tc('worker')}
                    </span>
                  </span>
                  {farmRow.active ? (
                    <Check className="w-4 h-4 text-[#2D6A4F]" />
                  ) : (
                    <span className="w-4 h-4" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href.endsWith('/dashboard')
                ? cleanPathname === item.href || cleanPathname === `${item.href}/`
                : cleanPathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex h-[48px] items-center gap-3 rounded-xl px-4 text-[14px] font-medium transition-all duration-200 group"
                style={{
                  color: active ? '#FFFFFF' : '#9C9890',
                  background: active 
                    ? 'linear-gradient(90deg, #1B4332 0%, #0D2818 100%)' 
                    : 'transparent',
                }}
              >
                {active && (
                  <span className="absolute inset-y-2 start-0 w-[4px] rounded-full bg-[#52B788]" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`flex-1 transition-colors duration-200 ${active ? 'text-white' : 'group-hover:text-[#D8F3DC]'}`}>
                  {item.label}
                </span>
                {item.showBadge && taskCount > 0 ? (
                  <span className="rounded-full bg-[#F4A261] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {taskCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 mt-auto">
        <div className="border-t p-3" style={{ borderColor: '#1B4332' }}>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center p-2 rounded-[12px] bg-transparent hover:bg-[#1B4332] transition-colors duration-200 outline-none text-left rtl:text-right cursor-pointer">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] font-display text-[16px] text-white shadow-sm transform transition-transform hover:scale-105">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 mx-3">
                  <p className="truncate text-[14px] font-semibold leading-tight text-white">
                    {fullName}
                  </p>
                  <p
                    className="truncate text-[12px] mt-0.5 text-[#9C9890]"
                    dir="ltr"
                  >
                    {user?.email ?? ''}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#9C9890]" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="center"
              sideOffset={12}
              className="w-[260px] p-2 bg-white rounded-[16px] border border-[#E4E0D8]"
              style={{
                boxShadow:
                  '0 10px 40px rgba(15,14,12,0.1), 0 2px 10px rgba(15,14,12,0.05)',
              }}
            >
              <div className="px-3 py-3 flex flex-col gap-1 items-center text-center bg-[#FAFAF7] rounded-[10px] mb-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-display text-[18px] mb-1 shadow-sm"
                  style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
                >
                  {initials}
                </div>
                <p className="text-[14px] font-bold text-[#2C2A24]">
                  {fullName}
                </p>
                <p className="text-[12px] text-[#5C5852]" dir="ltr">
                  {user?.email ?? ''}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <Link
                  href="/worker/settings"
                  className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#2C2A24] hover:bg-[#F0FAF3] hover:text-[#1B4332] rounded-[10px] transition-colors"
                  onClick={() => {
                    // Fallback route, you can adjust if worker settings doesn't exist
                  }}
                >
                  <Settings className="h-[18px] w-[18px]" />
                  {tc('settings')}
                </Link>

                <div className="h-px bg-[#E4E0D8] my-1" />

                <button
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left rtl:text-right text-[14px] font-medium text-[#E76F51] hover:bg-[#FEF2F2] rounded-[10px] transition-colors cursor-pointer"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  {t('logout')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </aside>
  );
}
