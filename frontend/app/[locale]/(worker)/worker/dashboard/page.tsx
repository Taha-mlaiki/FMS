'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck2, CheckCircle2, Loader2, TrendingUp, TrendingDown, LayoutTemplate, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/inline-error';
import {
  useWorkerDashboard,
  type WorkerDashboardOccurrence,
} from '@/lib/hooks/api/use-worker-dashboard';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { getApiErrorMessage } from '@/lib/error-handler';

function formatTime(time?: string): string {
  if (!time) return '--:--';
  return time.slice(0, 5);
}

function formatDate(value: string | undefined, locale: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  variant,
}: Readonly<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}>) {
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
    'rounded-[20px] p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group';
  const cardStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #F0EDE4',
  };

  return (
    <div className={cardClassName} style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: theme.bg }}
        >
          <Icon className="w-6 h-6" style={{ color: theme.icon }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8F9FA]" style={{ border: '1px solid #F0EDE4' }}>
            {trend.positive ? (
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#059669' }} />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
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
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  title,
  time,
  status,
  dateLabel,
  onClick,
  statusLabels,
}: Readonly<{
  title: string;
  time: string;
  status: string;
  dateLabel?: string;
  onClick: () => void;
  statusLabels: Record<string, string>;
}>) {
  const statusDotColors: Record<string, string> = {
    todo: '#9C9890',
    pending: '#F4A261',
    completed: '#2D6A4F',
    skipped: '#E76F51',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-[#FAFAF7] transition-colors text-right"
      style={{ borderBottom: '1px solid #F0EDE4' }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusDotColors[status] || '#9C9890' }}
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
        {statusLabels[status] || status}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="font-mono text-[13px]" style={{ color: '#5C5852' }}>
          {time}
        </span>
      </div>
    </button>
  );
}

function TaskList({
  title,
  tasks,
  onTaskClick,
  emptyTitle,
  emptyDescription,
  untitledTask,
  locale,
  statusLabels,
}: Readonly<{
  title: string;
  tasks: WorkerDashboardOccurrence[];
  onTaskClick: (task: WorkerDashboardOccurrence) => void;
  emptyTitle: string;
  emptyDescription: string;
  untitledTask: string;
  locale: string;
  statusLabels: Record<string, string>;
}>) {
  return (
    <section
      className="overflow-hidden rounded-[16px]"
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
        <h3 className="font-display text-[18px]" style={{ color: '#2C2A24' }}>
          {title}
        </h3>
      </div>

      {tasks.length === 0 ? (
        <div className="p-8 text-center">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="py-4"
          />
        </div>
      ) : (
        <div className="divide-y divide-[#F0EDE4]">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              title={task.title || untitledTask}
              time={formatTime(task.timeOfDay)}
              status={task.status || 'todo'}
              dateLabel={formatDate(task.scheduledDate, locale)}
              onClick={() => onTaskClick(task)}
              statusLabels={statusLabels}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function WorkerDashboardPage() {
  const locale = useLocale();
  const t = useTranslations('workerDashboard');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const { user } = useFarmContext();
  const { data, isLoading, isError, error, refetch } = useWorkerDashboard();
  const [selectedTask, setSelectedTask] =
    useState<WorkerDashboardOccurrence | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    return t('goodEvening');
  }, [t]);

  const firstName =
    user?.first_name ?? user?.full_name?.split(' ')[0] ?? t('friend');

  const todayTasks = data?.todayTasks ?? [];
  const recentCompletions = data?.recentCompletions ?? [];

  const statusLabels: Record<string, string> = {
    todo: tDashboard('statusLabels.todo'),
    pending: tDashboard('statusLabels.pending'),
    completed: tDashboard('statusLabels.completed'),
    skipped: tDashboard('statusLabels.skipped'),
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <header className="space-y-2">
          <div className="h-8 w-48 bg-[#F0EDE4] rounded-lg" />
          <div className="h-4 w-64 bg-[#F0EDE4]/50 rounded-lg" />
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-[16px] bg-white shadow-sm"
              style={{ border: '1px solid #F0EDE4' }}
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div
            className="h-[400px] rounded-[16px] bg-white shadow-sm"
            style={{ border: '1px solid #F0EDE4' }}
          />
          <div
            className="h-[400px] rounded-[16px] bg-white shadow-sm"
            style={{ border: '1px solid #F0EDE4' }}
          />
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <InlineError
        message={getApiErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[30px]" style={{ color: '#2C2A24' }}>
          {greeting}، {firstName}
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#5C5852' }}>
          {t('quickOverview')}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t('todayTasks')}
          value={todayTasks.length}
          icon={CalendarCheck2}
          variant="primary"
        />
        <KpiCard
          label={tDashboard('totalTasks')}
          value={data?.totalTasks ?? 0}
          icon={ListTodo}
          variant="info"
        />
        <KpiCard
          label={t('completedThisWeek')}
          value={recentCompletions.length}
          icon={CheckCircle2}
          variant="success"
        />
        <KpiCard
          label={t('totalCompletedLifetime')}
          value={data?.totalCompletedTasks ?? 0}
          icon={TrendingUp}
          variant="success"
        />
        <KpiCard
          label={t('totalSkippedLifetime')}
          value={data?.totalSkippedTasks ?? 0}
          icon={TrendingDown}
          variant="danger"
        />
        <KpiCard
          label={t('myFarms')}
          value={data?.myFarmsCount ?? 0}
          icon={LayoutTemplate}
          variant="info"
        />
        <KpiCard
          label={t('myReports')}
          value={data?.myReportsCount ?? 0}
          icon={Loader2}
          variant="warning"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TaskList
          title={t('todayTasks')}
          tasks={todayTasks}
          onTaskClick={setSelectedTask}
          emptyTitle={t('noData')}
          emptyDescription={t('tasksWillAppear')}
          untitledTask={tCommon('untitledTask')}
          locale={locale}
          statusLabels={statusLabels}
        />
        <TaskList
          title={t('recentCompleted')}
          tasks={recentCompletions}
          onTaskClick={setSelectedTask}
          emptyTitle={t('noData')}
          emptyDescription={t('tasksWillAppear')}
          untitledTask={tCommon('untitledTask')}
          locale={locale}
          statusLabels={statusLabels}
        />
      </section>

      <Dialog
        open={Boolean(selectedTask)}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <DialogContent className="sm:max-w-115" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-display text-[22px] text-right">
              {t('taskDetails')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-right">
            <p className="text-[16px] font-medium" style={{ color: '#2C2A24' }}>
              {selectedTask?.title || tCommon('untitledTask')}
            </p>
            <p className="text-[14px]" style={{ color: '#5C5852' }}>
              {t('dateLabel')}:{' '}
              {formatDate(selectedTask?.scheduledDate, locale)}
            </p>
            <p className="text-[14px]" style={{ color: '#5C5852' }}>
              {t('timeLabel')}: {formatTime(selectedTask?.timeOfDay)}
            </p>
            <p className="text-[14px]" style={{ color: '#5C5852' }}>
              {t('statusLabel')}: {selectedTask?.status ?? ''}
            </p>
          </div>

          <div className="pt-2 text-right">
            <Link
              href="/worker/tasks"
              className="inline-flex items-center gap-2 text-[14px] font-medium"
              style={{ color: '#2D6A4F' }}
              onClick={() => setSelectedTask(null)}
            >
              <Loader2 className="hidden h-4 w-4" />
              {t('goToTasks')}
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
