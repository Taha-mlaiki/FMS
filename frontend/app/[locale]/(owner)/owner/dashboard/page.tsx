'use client';

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  ListTodo,
  Loader2,
  RefreshCw,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  LayoutTemplate,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import {
  DashboardPeriod,
  OwnerDashboardResponse,
  useDashboard,
} from '@/lib/hooks/api/use-dashboard';
import { getApiErrorMessage } from '@/lib/error-handler';
import { usePreferencesStore } from '@/lib/stores/preferences.store';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/inline-error';

type OccurrenceStatus = 'todo' | 'pending' | 'completed' | 'skipped';

type DashboardOccurrence = {
  id: string;
  title?: string;
  timeOfDay?: string;
  scheduledDate?: string;
  status?: string;
};

type WorkerDashboardResponse = {
  todayTasks?: DashboardOccurrence[];
  recentCompletions?: DashboardOccurrence[];
  myReportsCount?: number;
  totalCompletedTasks?: number;
  totalSkippedTasks?: number;
  totalTasks?: number;
  myFarmsCount?: number;
};

type DashboardResponse = WorkerDashboardResponse | OwnerDashboardResponse;

function formatDisplayDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function formatTaskTime(value?: string): string {
  if (!value) return '--:--';
  return value.slice(0, 5);
}

/* ── KPI Card ── */
interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  href?: string;
}

function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  variant,
  href,
}: Readonly<KpiCardProps>) {
  const themes = {
    primary: { bg: '#EBF2FF', icon: '#2563EB' },
    success: { bg: '#ECFDF5', icon: '#059669' },
    warning: { bg: '#FFFBEB', icon: '#D97706' },
    danger: { bg: '#FEF2F2', icon: '#DC2626' },
    info: { bg: '#F0FDFA', icon: '#0D9488' },
    purple: { bg: '#F5F3FF', icon: '#7C3AED' },
  };

  const theme = variant ? themes[variant] : themes.primary;

  const cardClassName =
    'rounded-[20px] p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group h-full block';
  const cardStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #F0EDE4',
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: theme.bg }}
        >
          <Icon className="w-6 h-6" style={{ color: theme.icon }} />
        </div>
        {trend && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8F9FA]"
            style={{ border: '1px solid #F0EDE4' }}
          >
            {trend.positive ? (
              <TrendingUp
                className="w-3.5 h-3.5"
                style={{ color: '#059669' }}
              />
            ) : (
              <TrendingDown
                className="w-3.5 h-3.5"
                style={{ color: '#DC2626' }}
              />
            )}
            <span
              className="text-[12px] font-bold"
              style={{ color: trend.positive ? '#059669' : '#DC2626' }}
            >
              {trend.value}
            </span>
          </div>
        )}
      </div>
      <div>
        <span
          className="text-[13px] font-semibold tracking-wide"
          style={{ color: '#6B7280', textTransform: 'uppercase' }}
        >
          {label}
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span
            className="font-display text-[32px] font-bold leading-tight"
            style={{ color: '#111827' }}
          >
            {value}
          </span>
          {unit && (
            <span
              className="text-[16px] font-medium"
              style={{ color: '#9CA3AF' }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName} style={cardStyle}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClassName} style={cardStyle}>
      {content}
    </div>
  );
}

/* ── Period Selector ── */
function PeriodSelector({
  period,
  onChange,
}: Readonly<{
  period: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}>) {
  const t = useTranslations('dashboard');

  const periods = [
    { id: 'day' as const, label: t('period.day') },
    { id: 'week' as const, label: t('period.weekShort') },
    { id: 'month' as const, label: t('period.monthShort') },
    { id: 'year' as const, label: t('period.yearShort') },
  ];

  return (
    <div
      className="flex rounded-[10px] p-1 h-9"
      style={{ backgroundColor: '#F0EDE4' }}
    >
      {periods.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`px-4 rounded-[8px] text-[13px] font-medium transition-all duration-200 cursor-pointer ${
            item.id === period
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'text-[#5C5852] hover:text-[#2C2A24]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ── Task Row ── */
interface TaskRowProps {
  title: string;
  time: string;
  status: OccurrenceStatus;
  dateLabel?: string;
  statusLabels: Record<OccurrenceStatus, string>;
}

const statusDotColors = {
  todo: '#9C9890',
  pending: '#F4A261',
  completed: '#2D6A4F',
  skipped: '#E76F51',
};

function TaskRow({
  title,
  time,
  status,
  dateLabel,
  statusLabels,
}: Readonly<TaskRowProps>) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF7] transition-colors"
      style={{ borderBottom: '1px solid #F0EDE4' }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusDotColors[status] }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-medium truncate"
          style={{ color: '#2C2A24' }}
        >
          {title}
        </p>
      </div>
      {dateLabel && (
        <span
          className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}
        >
          {dateLabel}
        </span>
      )}
      <span
        className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: '#F0EDE4', color: '#5C5852' }}
      >
        {statusLabels[status]}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Clock className="w-3.5 h-3.5" style={{ color: '#9C9890' }} />
        <span className="font-mono text-[13px]" style={{ color: '#5C5852' }}>
          {time}
        </span>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');

  const { user, isOwner } = useFarmContext();
  const dashboardPeriod = usePreferencesStore((state) => state.dashboardPeriod);
  const setDashboardPeriod = usePreferencesStore(
    (state) => state.setDashboardPeriod,
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useDashboard(dashboardPeriod);

  const dashboard = (data ?? {}) as DashboardResponse;
  const workerDashboard = dashboard as WorkerDashboardResponse;
  const ownerDashboard = dashboard as OwnerDashboardResponse;

  const todayTasks = workerDashboard.todayTasks ?? [];
  const recentCompletions = workerDashboard.recentCompletions ?? [];
  const myReportsCount = workerDashboard.myReportsCount ?? 0;

  const todayCompleted = todayTasks.filter(
    (task) => task.status === 'completed',
  ).length;
  const pendingToday = todayTasks.filter(
    (task) => task.status === 'todo' || task.status === 'pending',
  ).length;
  const completionRate =
    todayTasks.length > 0
      ? Math.round((todayCompleted / todayTasks.length) * 100)
      : 0;

  const statusTotals = {
    todo: todayTasks.filter((task) => task.status === 'todo').length,
    pending: todayTasks.filter((task) => task.status === 'pending').length,
    completed: todayTasks.filter((task) => task.status === 'completed').length,
    skipped: todayTasks.filter((task) => task.status === 'skipped').length,
  };

  const statusLabels: Record<OccurrenceStatus, string> = {
    todo: t('statusLabels.todo'),
    pending: t('statusLabels.pending'),
    completed: t('statusLabels.completed'),
    skipped: t('statusLabels.skipped'),
  };

  const maxStatusValue = Math.max(...Object.values(statusTotals), 1);
  const firstName = user?.first_name ?? user?.full_name?.split(' ')[0] ?? '';
  const subtitleDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const ownerRecentTasks = ownerDashboard.recentTasks ?? [];
  const ownerTaskSummary = ownerDashboard.taskSummary ?? {
    total: 0,
    todo: 0,
    pending: 0,
    completed: 0,
    skipped: 0,
    completionRate: 0,
  };
  const ownerReportsSummary = ownerDashboard.reportsSummary ?? {
    total: 0,
    resolved: 0,
    open: 0,
  };
  const ownerAlertsCount = ownerDashboard.lowStockAlertsCount ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <header className="space-y-2">
          <div className="h-8 w-48 bg-[#F0EDE4] rounded-lg" />
          <div className="h-4 w-64 bg-[#F0EDE4]/50 rounded-lg" />
        </header>

        {/* KPI Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-[16px] bg-white shadow-sm"
              style={{ border: '1px solid #F0EDE4' }}
            />
          ))}
        </section>

        {/* Charts and Tasks Row */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div
            className="xl:col-span-2 h-[450px] rounded-[16px] bg-white shadow-sm"
            style={{ border: '1px solid #F0EDE4' }}
          />
          <div
            className="h-[450px] rounded-[16px] bg-white shadow-sm"
            style={{ border: '1px solid #F0EDE4' }}
          />
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-[16px] p-6"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <h2 className="font-display text-[24px]" style={{ color: '#2C2A24' }}>
          {t('loadError')}
        </h2>
        <p className="text-[14px] mt-2" style={{ color: '#5C5852' }}>
          {getApiErrorMessage(error)}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium text-white"
          style={{ backgroundColor: '#2D6A4F' }}
        >
          <RefreshCw className="w-4 h-4" />
          {tc('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[28px]" style={{ color: '#2C2A24' }}>
            {t('welcome', { name: firstName })} 👋
          </h2>
          <p className="text-[15px] mt-1" style={{ color: '#5C5852' }}>
            {t('todayDate', { date: subtitleDate, count: todayTasks.length })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && (
            <Loader2
              className="w-4 h-4 animate-spin"
              style={{ color: '#5C5852' }}
            />
          )}
          <PeriodSelector
            period={dashboardPeriod}
            onChange={(period) => setDashboardPeriod(period)}
          />
        </div>
      </div>

      {isOwner && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <KpiCard
              label={t('totalWorkers')}
              value={ownerDashboard.totalWorkers.toString()}
              icon={Users}
              variant="info"
              trend={{
                value: tc('active'),
                positive: true,
              }}
            />
            <KpiCard
              label={t('totalTemplates')}
              value={ownerDashboard.totalActiveTemplates.toString()}
              icon={LayoutTemplate}
              variant="purple"
            />
            <KpiCard
              label={t('totalTasks')}
              value={ownerDashboard.totalTasks.toString()}
              icon={ListTodo}
              variant="primary"
              trend={{
                value: `${ownerTaskSummary.pending} ${t('statusLabels.pending')}`,
                positive: ownerTaskSummary.pending < ownerTaskSummary.total,
              }}
            />
            <KpiCard
              label={t('completionRate')}
              value={`${ownerTaskSummary.completionRate}`}
              unit="%"
              icon={CheckCircle2}
              variant="success"
            />
            <KpiCard
              label={t('reportsLabel')}
              value={ownerReportsSummary.total.toString()}
              icon={FileText}
              variant="primary"
              trend={{
                value: `${ownerReportsSummary.open} ${t('openReports')}`,
                positive: ownerReportsSummary.open === 0,
              }}
              href="/owner/reports"
            />
            <KpiCard
              label={t('stockAlerts')}
              value={ownerAlertsCount.toString()}
              icon={Timer}
              variant={ownerAlertsCount > 0 ? 'danger' : 'success'}
              trend={{
                value:
                  ownerAlertsCount > 0 ? t('needsAttention') : t('stockStable'),
                positive: ownerAlertsCount === 0,
              }}
              href="/owner/stock"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div
              className="rounded-[16px] overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid #F0EDE4' }}
              >
                <h3
                  className="font-display text-[18px]"
                  style={{ color: '#2C2A24' }}
                >
                  {t('taskStatus')} ({dashboardPeriod})
                </h3>
                <Link
                  href="/owner/tasks"
                  className="flex items-center gap-1 text-[13px] font-medium transition-colors hover:underline"
                  style={{ color: '#2D6A4F' }}
                >
                  {tc('viewAll')}
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div
                  className="rounded-[10px] p-3"
                  style={{ backgroundColor: '#F8FAF8' }}
                >
                  <p className="text-[12px]" style={{ color: '#5C5852' }}>
                    {t('statusLabels.todo')}
                  </p>
                  <p
                    className="font-display text-[24px]"
                    style={{ color: '#2C2A24' }}
                  >
                    {ownerTaskSummary.todo}
                  </p>
                </div>
                <div
                  className="rounded-[10px] p-3"
                  style={{ backgroundColor: '#F8FAF8' }}
                >
                  <p className="text-[12px]" style={{ color: '#5C5852' }}>
                    {t('statusLabels.pending')}
                  </p>
                  <p
                    className="font-display text-[24px]"
                    style={{ color: '#2C2A24' }}
                  >
                    {ownerTaskSummary.pending}
                  </p>
                </div>
                <div
                  className="rounded-[10px] p-3"
                  style={{ backgroundColor: '#F8FAF8' }}
                >
                  <p className="text-[12px]" style={{ color: '#5C5852' }}>
                    {t('statusLabels.completed')}
                  </p>
                  <p
                    className="font-display text-[24px]"
                    style={{ color: '#2C2A24' }}
                  >
                    {ownerTaskSummary.completed}
                  </p>
                </div>
                <div
                  className="rounded-[10px] p-3"
                  style={{ backgroundColor: '#F8FAF8' }}
                >
                  <p className="text-[12px]" style={{ color: '#5C5852' }}>
                    {t('statusLabels.skipped')}
                  </p>
                  <p
                    className="font-display text-[24px]"
                    style={{ color: '#2C2A24' }}
                  >
                    {ownerTaskSummary.skipped}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-[16px] overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid #F0EDE4' }}
              >
                <h3
                  className="font-display text-[18px]"
                  style={{ color: '#2C2A24' }}
                >
                  {t('recentFarmTasks')}
                </h3>
              </div>
              {ownerRecentTasks.length === 0 && (
                <p
                  className="px-4 py-6 text-[14px]"
                  style={{ color: '#9C9890' }}
                >
                  {t('noTasksInPeriod')}
                </p>
              )}
              {ownerRecentTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  title={task.title || tc('untitledTask')}
                  time={formatTaskTime(task.timeOfDay)}
                  status={(task.status as OccurrenceStatus) || 'todo'}
                  dateLabel={formatDisplayDate(task.scheduledDate)}
                  statusLabels={statusLabels}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {!isOwner && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <KpiCard
              label={t('worker.todayTasks')}
              value={todayTasks.length.toString()}
              icon={CalendarDays}
              variant="primary"
              trend={{
                value: `${pendingToday} ${t('statusLabels.pending')}`,
                positive: pendingToday > 0,
              }}
            />
            <KpiCard
              label={t('totalTasks')}
              value={(workerDashboard.totalTasks ?? 0).toString()}
              icon={ListTodo}
              variant="info"
            />
            <KpiCard
              label={t('totalCompletedLifetime')}
              value={(workerDashboard.totalCompletedTasks ?? 0).toString()}
              icon={CheckCircle2}
              variant="success"
            />
            <KpiCard
              label={t('totalSkippedLifetime')}
              value={(workerDashboard.totalSkippedTasks ?? 0).toString()}
              icon={TrendingDown}
              variant="danger"
            />
            <KpiCard
              label={t('myFarms')}
              value={(workerDashboard.myFarmsCount ?? 0).toString()}
              icon={LayoutTemplate}
              variant="info"
            />
            <KpiCard
              label={t('worker.completedToday')}
              value={todayCompleted.toString()}
              icon={CheckCircle2}
              variant="success"
              trend={{
                value: `${completionRate}% ${t('worker.completion')}`,
                positive: completionRate >= 50,
              }}
            />
            <KpiCard
              label={t('worker.myReports')}
              value={myReportsCount.toString()}
              icon={FileText}
              variant="warning"
              href="/owner/reports"
            />
            <KpiCard
              label={t('worker.upcomingTasks')}
              value={pendingToday.toString()}
              icon={Timer}
              variant="primary"
              trend={{
                value:
                  pendingToday > 0
                    ? t('worker.needsFollowup')
                    : t('worker.noPendingTasks'),
                positive: pendingToday === 0,
              }}
            />
            <KpiCard
              label={t('worker.last7Days')}
              value={recentCompletions.length.toString()}
              icon={TrendingUp}
              variant="success"
              href="/owner/tasks"
            />
            <KpiCard
              label={t('worker.todayStatuses')}
              value={`${statusTotals.todo + statusTotals.pending + statusTotals.completed + statusTotals.skipped}`}
              icon={ListTodo}
              variant="primary"
              unit={t('worker.taskUnit')}
            />
          </div>

          {/* Status and activity overview */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Status Distribution */}
            <div
              className="xl:col-span-3 rounded-[16px] p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="font-display text-[20px]"
                  style={{ color: '#2C2A24' }}
                >
                  {t('worker.statusDistribution')}
                </h3>
              </div>
              <div className="space-y-4">
                {(Object.keys(statusTotals) as OccurrenceStatus[]).map(
                  (status) => {
                    const value = statusTotals[status];
                    const width = Math.max(
                      8,
                      Math.round((value / maxStatusValue) * 100),
                    );

                    return (
                      <div key={status} className="space-y-1">
                        <div
                          className="flex items-center justify-between text-[13px]"
                          style={{ color: '#5C5852' }}
                        >
                          <span>{statusLabels[status]}</span>
                          <span
                            className="font-medium"
                            style={{ color: '#2C2A24' }}
                          >
                            {value}
                          </span>
                        </div>
                        <div
                          className="h-2.5 rounded-full"
                          style={{ backgroundColor: '#F0EDE4' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${width}%`,
                              backgroundColor: statusDotColors[status],
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Recent completion timeline */}
            <div
              className="xl:col-span-2 rounded-[16px] p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <h3
                className="font-display text-[20px] mb-6"
                style={{ color: '#2C2A24' }}
              >
                {t('worker.recentCompletions')}
              </h3>
              <div className="space-y-3">
                {recentCompletions.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-[10px] px-3 py-2"
                    style={{ backgroundColor: '#F8FAF8' }}
                  >
                    <p
                      className="text-[14px] font-medium truncate"
                      style={{ color: '#2C2A24' }}
                    >
                      {task.title || tc('untitledTask')}
                    </p>
                    <p
                      className="text-[12px] mt-1"
                      style={{ color: '#5C5852' }}
                    >
                      {formatDisplayDate(task.scheduledDate)} -{' '}
                      {formatTaskTime(task.timeOfDay)}
                    </p>
                  </div>
                ))}
                {recentCompletions.length === 0 && (
                  <p className="text-[14px]" style={{ color: '#9C9890' }}>
                    {t('worker.noRecentCompletions')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tasks & Submissions */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* My Tasks Today */}
            <div
              className="rounded-[16px] overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid #F0EDE4' }}
              >
                <h3
                  className="font-display text-[18px]"
                  style={{ color: '#2C2A24' }}
                >
                  {t('worker.myTasksToday')}
                </h3>
                <Link
                  href="/owner/tasks"
                  className="flex items-center gap-1 text-[13px] font-medium transition-colors hover:underline"
                  style={{ color: '#2D6A4F' }}
                >
                  {tc('viewAll')}
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
              {todayTasks.length === 0 && (
                <p
                  className="px-4 py-6 text-[14px]"
                  style={{ color: '#9C9890' }}
                >
                  {t('worker.noTasksToday')}
                </p>
              )}
              {todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  title={task.title || tc('untitledTask')}
                  time={formatTaskTime(task.timeOfDay)}
                  status={(task.status as OccurrenceStatus) || 'todo'}
                  dateLabel={formatDisplayDate(task.scheduledDate)}
                  statusLabels={statusLabels}
                />
              ))}
            </div>

            {/* My Recent Submissions */}
            <div
              className="rounded-[16px] overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow:
                  '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid #F0EDE4' }}
              >
                <h3
                  className="font-display text-[18px]"
                  style={{ color: '#2C2A24' }}
                >
                  {t('worker.myRecentSubmissions')}
                </h3>
                <Link
                  href="/owner/tasks"
                  className="flex items-center gap-1 text-[13px] font-medium transition-colors hover:underline"
                  style={{ color: '#2D6A4F' }}
                >
                  {tc('viewAll')}
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
              {recentCompletions.length === 0 && (
                <p
                  className="px-4 py-6 text-[14px]"
                  style={{ color: '#9C9890' }}
                >
                  {t('worker.noRecentSubmissions')}
                </p>
              )}
              {recentCompletions.slice(0, 5).map((task) => (
                <TaskRow
                  key={task.id}
                  title={task.title || tc('untitledTask')}
                  time={formatTaskTime(task.timeOfDay)}
                  status="completed"
                  dateLabel={formatDisplayDate(task.scheduledDate)}
                  statusLabels={statusLabels}
                />
              ))}
            </div>
          </div>

          {/* Reports Summary */}
          <div
            className="rounded-[16px] p-6"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow:
                '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
            }}
          >
            <h3
              className="font-display text-[20px] mb-6"
              style={{ color: '#2C2A24' }}
            >
              {t('worker.workerReportsSummary')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-[12px] p-4"
                style={{ backgroundColor: '#F8FAF8' }}
              >
                <p
                  className="text-[12px] uppercase"
                  style={{ color: '#5C5852' }}
                >
                  {t('worker.totalMyReports')}
                </p>
                <p
                  className="font-display text-[32px] mt-1"
                  style={{ color: '#2C2A24' }}
                >
                  {myReportsCount}
                </p>
              </div>
              <div
                className="rounded-[12px] p-4"
                style={{ backgroundColor: '#F8FAF8' }}
              >
                <p
                  className="text-[12px] uppercase"
                  style={{ color: '#5C5852' }}
                >
                  {t('worker.weeklyCompletions')}
                </p>
                <p
                  className="font-display text-[32px] mt-1"
                  style={{ color: '#2C2A24' }}
                >
                  {recentCompletions.length}
                </p>
              </div>
              <div
                className="rounded-[12px] p-4"
                style={{ backgroundColor: '#F8FAF8' }}
              >
                <p
                  className="text-[12px] uppercase"
                  style={{ color: '#5C5852' }}
                >
                  {t('worker.todayCompletionRate')}
                </p>
                <p
                  className="font-display text-[32px] mt-1"
                  style={{ color: '#2C2A24' }}
                >
                  {completionRate}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
