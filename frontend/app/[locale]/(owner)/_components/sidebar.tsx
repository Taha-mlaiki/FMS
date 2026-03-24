'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  Layers,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronsUpDown,
  Plus,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLogout } from '@/lib/hooks/use-auth';
import { useTaskCount } from '@/lib/hooks/api/use-occurrences';
import { useStockAlertsCount } from '@/lib/hooks/api/use-stock';
import { useSwitchFarm } from '@/lib/hooks/api/use-farms';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { useUiStore } from '@/lib/stores/ui.store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface NavItemDef {
  key: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: 'tasks' | 'stock';
  badgeColor?: string;
  ownerOnly?: boolean;
}

const navItemDefs: NavItemDef[] = [
  { key: 'dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  {
    key: 'tasks',
    href: '/owner/tasks',
    icon: ListTodo,
    badgeKey: 'tasks',
    badgeColor: '#F4A261',
  },
  { key: 'groups', href: '/owner/groups', icon: Layers },
  {
    key: 'stock',
    href: '/owner/stock',
    icon: Package,
    badgeKey: 'stock',
    badgeColor: '#E76F51',
  },
  { key: 'reports', href: '/owner/reports', icon: FileText },
  { key: 'workers', href: '/owner/workers', icon: Users },
];

const ownerNavItemDefs: NavItemDef[] = [
  {
    key: 'farmSettings',
    href: '/owner/settings',
    icon: Settings,
    ownerOnly: true,
  },
];

function parseCount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'object') return 0;

  const record = value as Record<string, unknown>;
  const candidates = [record.count, record.total, record.data];

  for (const candidate of candidates) {
    if (typeof candidate === 'number') return candidate;
    if (candidate && typeof candidate === 'object') {
      const nestedCount = (candidate as Record<string, unknown>).count;
      if (typeof nestedCount === 'number') return nestedCount;
    }
  }

  return 0;
}

export function Sidebar() {
  const fullPathname = usePathname();
  const pathname = fullPathname.replace(/^\/(ar|en)(\/|$)/, '$2') || '/';
  if (!pathname.startsWith('/')) {
    // Ensure it starts with / for consistency
  }
  const cleanPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const logout = useLogout();
  const switchFarmMutation = useSwitchFarm();
  const { farm, farms, user, role, farmId } = useFarmContext();
  const { data: taskCountData } = useTaskCount();
  const { data: stockAlertsData } = useStockAlertsCount();
  const [farmSwitcherOpen, setFarmSwitcherOpen] = useState(false);
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const t = useTranslations('sidebar');
  const tc = useTranslations('common');

  const navItems = navItemDefs.map((item) => ({
    ...item,
    label: t(item.key),
  }));

  const ownerNavItems = ownerNavItemDefs.map((item) => ({
    ...item,
    label: t(item.key),
  }));

  const currentUserName =
    user?.full_name?.trim() ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.email ||
    tc('user');
  const currentUserEmail = user?.email ?? '';
  const currentFarmName = farm?.name ?? t('chooseFarm');
  const currentFarmLocation =
    farm?.location ?? farm?.address ?? tc('noLocation');
  const farmsCount = farms.length;
  const isOwner = role === 'OWNER';

  const badges = {
    tasks: parseCount(taskCountData),
    stock: parseCount(stockAlertsData),
  };

  async function handleFarmSwitch(nextFarmId: string) {
    if (!nextFarmId || nextFarmId === farmId) return;
    await switchFarmMutation.mutateAsync(nextFarmId);
    setFarmSwitcherOpen(false);
  }

  function isActive(href: string) {
    // Exact match for dashboard, startWith for others to catch nested routes
    if (href.endsWith('/dashboard')) {
      return cleanPathname === href || cleanPathname === `${href}/`;
    }
    return cleanPathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => useUiStore.getState().toggleSidebar()}
        />
      )}
      <aside
        className={`fixed md:relative inset-y-0 start-0 flex flex-col h-screen shrink-0 z-50 md:z-40 transition-transform duration-300 border-r rtl:border-l rtl:border-r-0 ${
          isSidebarCollapsed
            ? '-translate-x-full rtl:translate-x-full md:translate-x-0'
            : 'translate-x-0'
        }`}
        style={{
          width: isSidebarCollapsed ? '88px' : '280px',
          backgroundColor: '#0D2818',
          borderColor: '#1B4332',
        }}
      >
        {/* Farm Switcher */}
        <div className="p-3 border-b" style={{ borderColor: '#1B4332' }}>
          <Popover open={farmSwitcherOpen} onOpenChange={setFarmSwitcherOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => setFarmSwitcherOpen(!farmSwitcherOpen)}
                className={`flex items-center w-full rounded-xl p-2 transition-colors duration-200 hover:bg-[#1B4332] cursor-pointer outline-none text-left rtl:text-right ${
                  isSidebarCollapsed ? 'justify-center' : 'gap-3'
                }`}
                title={isSidebarCollapsed ? currentFarmName : undefined}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-display transition-transform hover:scale-105 shadow-sm"
                  style={{ backgroundColor: '#2D6A4F' }}
                >
                  <span className="text-white text-[16px]">🌿</span>
                </div>
                {!isSidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-white truncate leading-tight mb-0.5">
                        {currentFarmName}
                      </p>
                      <p
                        className="text-[12px] truncate"
                        style={{ color: '#9C9890' }}
                      >
                        {currentFarmLocation}
                      </p>
                    </div>
                    <ChevronsUpDown
                      className={`w-4 h-4 text-[#9C9890] transition-transform duration-200 ${
                        farmSwitcherOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className={`absolute top-full mt-1 rounded-[16px] p-2 z-50 ${
                isSidebarCollapsed ? 'right-2 w-[240px]' : 'right-4 left-4'
              }`}
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
              }}
            >
              <div className="px-3 py-2">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: '#2C2A24' }}
                >
                  {t('currentFarm')}
                </p>
                <p className="text-[12px]" style={{ color: '#5C5852' }}>
                  {currentFarmName} - {currentFarmLocation}
                </p>
              </div>
              <div
                className="my-1 h-px"
                style={{ backgroundColor: '#E4E0D8' }}
              />
              {farms.length === 0 && (
                <p
                  className="px-3 py-2 text-[13px]"
                  style={{ color: '#5C5852' }}
                >
                  {t('noFarmsAvailable')}
                </p>
              )}
              {farms.map((farmItem) => {
                const selected = farmItem.id === farmId;
                return (
                  <button
                    key={farmItem.id}
                    onClick={() => void handleFarmSwitch(farmItem.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[8px] w-full text-right transition-colors cursor-pointer ${
                      selected ? 'bg-[#F0FAF3]' : 'hover:bg-[#FAFAF7]'
                    }`}
                  >
                    {selected ? (
                      <Check className="w-4 h-4" style={{ color: '#2D6A4F' }} />
                    ) : (
                      <span className="w-4 h-4" />
                    )}
                    <span
                      className="text-[14px] font-medium text-right flex-1"
                      style={{ color: '#2C2A24' }}
                    >
                      {farmItem.name}
                      <span
                        className="block text-[12px] font-normal"
                        style={{ color: '#5C5852' }}
                      >
                        {farmItem.location ??
                          farmItem.address ??
                          tc('noLocation')}
                      </span>
                    </span>
                  </button>
                );
              })}
              {/* Create new farm */}
              <Link
                href="/onboarding/create-farm"
                className="flex items-center gap-2 px-3 py-2 mt-1 rounded-[8px] w-full hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                onClick={() => setFarmSwitcherOpen(false)}
              >
                <Plus className="w-4 h-4" style={{ color: '#F4A261' }} />
                <span className="text-[14px]" style={{ color: '#5C5852' }}>
                  {t('createNewFarm')}
                </span>
              </Link>
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 h-[48px] rounded-xl text-[14px] font-medium transition-all duration-200 group relative ${
                  isSidebarCollapsed ? 'justify-center' : 'gap-3'
                }`}
                style={{
                  color: active ? '#FFFFFF' : '#9C9890',
                  background: active 
                    ? 'linear-gradient(90deg, #1B4332 0%, #0D2818 100%)' 
                    : 'transparent',
                }}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                {/* Active indicator line - Logical positioning */}
                {active && (
                  <div
                    className="absolute inset-y-2 start-0 w-[4px] rounded-full"
                    style={{ backgroundColor: '#52B788' }}
                  />
                )}
                <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isSidebarCollapsed && (
                  <span className={`flex-1 transition-colors duration-200 ${active ? 'text-white' : 'group-hover:text-[#D8F3DC]'}`}>
                    {item.label}
                  </span>
                )}
                {item.badgeKey && badges[item.badgeKey] > 0 && (
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: item.badgeColor }}
                  >
                    {badges[item.badgeKey]}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Owner-only divider and items */}
          {isOwner && (
            <>
              <div
                className="my-3 mx-3 h-px"
                style={{ backgroundColor: '#1B4332' }}
              />
              {ownerNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 h-[48px] rounded-xl text-[14px] font-medium transition-all duration-200 group relative ${
                      isSidebarCollapsed ? 'justify-center' : 'gap-3'
                    }`}
                    style={{
                      color: active ? '#FFFFFF' : '#9C9890',
                      background: active 
                        ? 'linear-gradient(90deg, #1B4332 0%, #0D2818 100%)' 
                        : 'transparent',
                    }}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    {active && (
                      <div
                        className="absolute inset-y-2 start-0 w-[4px] rounded-full"
                        style={{ backgroundColor: '#52B788' }}
                      />
                    )}
                    <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {!isSidebarCollapsed && (
                      <span className={`flex-1 transition-colors duration-200 ${active ? 'text-white' : 'group-hover:text-[#D8F3DC]'}`}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section with Popover */}
        <div className="p-3" style={{ borderTop: '1px solid #1B4332' }}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center p-2 rounded-[12px] transition-colors duration-200 hover:bg-[#1B4332] cursor-pointer outline-none"
                title={isSidebarCollapsed ? currentUserName : undefined}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-display text-[16px] shadow-sm transform transition-transform hover:scale-105"
                  style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
                >
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
                {!isSidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0 ml-3 mr-3 text-left rtl:text-right">
                      <p className="text-[14px] font-semibold text-white truncate leading-tight">
                        {currentUserName}
                      </p>
                      <p
                        className="text-[12px] truncate mt-0.5"
                        style={{ color: '#9C9890' }}
                        dir="ltr"
                      >
                        {currentUserEmail}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#9C9890] flex-shrink-0" />
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side={isSidebarCollapsed ? 'right' : 'top'}
              align={isSidebarCollapsed ? 'end' : 'center'}
              sideOffset={12}
              className="w-[260px] p-2 bg-white rounded-[16px] shadow-xl border border-[#E4E0D8]"
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
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
                <p className="text-[14px] font-bold text-[#2C2A24]">
                  {currentUserName}
                </p>
                <p className="text-[12px] text-[#5C5852]">{currentUserEmail}</p>
              </div>

              <div className="flex flex-col gap-1">
                <Link
                  href="/owner/settings"
                  className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#2C2A24] hover:bg-[#F0FAF3] hover:text-[#1B4332] rounded-[10px] transition-colors"
                >
                  <Settings className="w-[18px] h-[18px]" />
                  {t('farmSettings')}
                </Link>

                <div className="h-px bg-[#E4E0D8] my-1" />

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#E76F51] hover:bg-[#FEF2F2] rounded-[10px] transition-colors cursor-pointer"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  {t('logout')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </aside>
    </>
  );
}
