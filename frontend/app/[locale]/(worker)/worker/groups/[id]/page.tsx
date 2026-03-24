'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/inline-error';
import { Button } from '@/components/ui/button';
import { useGroup } from '@/lib/hooks/api/use-groups';
import { useMetrics } from '@/lib/hooks/api/use-metrics';
import { useOccurrences } from '@/lib/hooks/api/use-occurrences';
import { useReports } from '@/lib/hooks/api/use-reports';

type GroupTab = 'metrics' | 'tasks' | 'reports';
type DashboardPeriod = 'day' | 'week' | 'month' | 'year';

type GroupStatus = 'active' | 'sold' | 'closed';

type GroupViewModel = {
  id: string;
  name: string;
  typeLabel: string;
  status: GroupStatus;
  currentQty: number;
  initialQty: number;
  startDate: string;
  daysActive: number;
};

type MetricRecord = {
  date?: string;
  value?: number | string;
  metricName?: string;
};

type TaskOccurrence = {
  id: string;
  title?: string;
  status?: string;
  scheduled_date?: string;
  time_of_day?: string;
};

type ReportItem = {
  id: string;
  type?: string;
  severity?: string;
  status?: string;
  description?: string;
  created_at?: string;
};

const getStatusStyles = (t: any) => ({
  active: { bg: '#D8F3DC', color: '#1B4332', label: t('statusActive') },
  sold: { bg: '#DBEAFE', color: '#1E40AF', label: t('statusSold') },
  closed: { bg: '#E4E0D8', color: '#5C5852', label: t('statusClosed') },
});

const getReportStatusStyles = (t: any) => ({
  open: { bg: '#FDDCB5', color: '#7A5C00', label: t('statusOpen') },
  in_review: { bg: '#DBEAFE', color: '#1E40AF', label: t('statusInReview') },
  resolved: { bg: '#D8F3DC', color: '#1B4332', label: t('statusResolved') },
});

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function formatDate(value?: string, withYear = false): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-u-nu-latn', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date);
}

function formatTime(value?: string): string {
  if (!value) return '--:--';
  return value.slice(0, 5);
}

function normalizeStatus(value?: string): GroupStatus {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'sold' || normalized === 'closed') return normalized;
  return 'active';
}

function getTypeLabel(t: any, type?: string, species?: string, breed?: string): string {
  const source = (type || species || breed || '').toLowerCase();
  if (source === 'broiler') return t('typeBroiler');
  if (source === 'layer') return t('typeLayer');
  if (source === 'duck') return t('typeDuck');
  if (source === 'turkey') return t('typeTurkey');
  return type || species || breed || t('unspecified');
}

function normalizeGroup(t: any, payload: unknown): GroupViewModel | null {
  if (!payload || typeof payload !== 'object') return null;

  const source = payload as Record<string, unknown>;
  const group =
    typeof source.group === 'object' && source.group !== null
      ? (source.group as Record<string, unknown>)
      : source;

  const id = toString(group.id ?? group.group_id ?? group.groupId);
  if (!id) return null;

  const initialQty = toNumber(group.initial_quantity ?? group.initialQuantity);
  const currentQty = toNumber(group.current_quantity ?? group.currentQuantity);
  const arrivalDate = toString(group.arrival_date ?? group.arrivalDate);

  const daysActive = arrivalDate
    ? Math.max(
        Math.ceil(
          (Date.now() - new Date(arrivalDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        0,
      )
    : 0;

  return {
    id,
    name: toString(group.name) || t("unnamedGroup"),
    typeLabel: getTypeLabel(
      toString(group.type),
      toString(group.species),
      toString(group.breed),
    ),
    status: normalizeStatus(toString(group.status)),
    currentQty,
    initialQty,
    startDate: formatDate(arrivalDate, true),
    daysActive,
  };
}

function normalizeMetricRecords(payload: unknown): MetricRecord[] {
  if (Array.isArray(payload)) return payload as MetricRecord[];
  if (!payload || typeof payload !== 'object') return [];

  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.records)) return source.records as MetricRecord[];
  if (Array.isArray(source.data)) return source.data as MetricRecord[];
  return [];
}

function normalizeOccurrences(payload: unknown): TaskOccurrence[] {
  if (Array.isArray(payload)) return payload as TaskOccurrence[];
  if (!payload || typeof payload !== 'object') return [];

  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.occurrences))
    return source.occurrences as TaskOccurrence[];
  if (Array.isArray(source.data)) return source.data as TaskOccurrence[];
  return [];
}

function normalizeReports(payload: unknown): ReportItem[] {
  if (Array.isArray(payload)) return payload as ReportItem[];
  if (!payload || typeof payload !== 'object') return [];

  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.reports)) return source.reports as ReportItem[];
  if (Array.isArray(source.data)) return source.data as ReportItem[];
  return [];
}

function chartPoints(t: any, records: MetricRecord[]) {
  return records
    .filter(
      (record) => typeof record.value !== 'undefined' && record.value !== null,
    )
    .map((record) => ({
      date: formatDate(record.date),
      value: toNumber(record.value),
      metricName: record.metricName || t('metric'),
    }));
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;

  const maybeError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = maybeError.response?.data?.message;
  if (Array.isArray(message) && message.length > 0)
    return message[0] ?? fallback;
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

export default function WorkerGroupDetailPage() {
  const t = useTranslations('groups');
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const groupId =
    typeof rawId === 'string'
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0] || ''
        : '';

  const [activeTab, setActiveTab] = useState<GroupTab>('metrics');
  const [period, setPeriod] = useState<DashboardPeriod>('month');

  const groupQuery = useGroup(groupId || null);
  const metricsQuery = useMetrics({ groupId, period });
  const tasksQuery = useOccurrences({ group_id: groupId, page: 1, limit: 20 });
  const reportsQuery = useReports({ group_id: groupId, page: 1, limit: 20 });

  const group = useMemo(
    () => normalizeGroup(t, groupQuery.data),
    [groupQuery.data],
  );
  const metrics = useMemo(
    () => normalizeMetricRecords(metricsQuery.data),
    [metricsQuery.data],
  );
  const tasks = useMemo(
    () => normalizeOccurrences(tasksQuery.data),
    [tasksQuery.data],
  );
  const reports = useMemo(
    () => normalizeReports(reportsQuery.data),
    [reportsQuery.data],
  );
  const points = useMemo(() => chartPoints(t, metrics), [metrics]);

  if (groupQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2">
        <Loader2
          className="h-5 w-5 animate-spin"
          style={{ color: '#2D6A4F' }}
        />
        <span className="text-[14px]" style={{ color: '#5C5852' }}>
          {t('loadingGroup')}
        </span>
      </div>
    );
  }

  if (groupQuery.isError || !group) {
    return (
      <InlineError
        message={getApiErrorMessage(groupQuery.error, t('errorGroup'))}
        onRetry={() => {
          void groupQuery.refetch();
        }}
      />
    );
  }

  const status = getStatusStyles(t)[group.status];

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-2 text-[13px]"
        style={{ color: '#9C9890' }}
      >
        <Link
          href="/worker/groups"
          className="hover:underline"
          style={{ color: '#2D6A4F' }}
        >
          {t('groupsNav')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        <span style={{ color: '#2C2A24' }}>{group.name}</span>
      </div>

      <section
        className="rounded-[16px] px-8 py-6"
        style={{ background: 'linear-gradient(135deg, #0D2818, #1B4332)' }}
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="font-display text-[32px] text-white">
                {group.name}
              </h1>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase"
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
              >
                {group.typeLabel}
              </span>
            </div>
            <span
              className="inline-flex rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center">
              <p
                className="font-display text-[28px] text-white tabular-nums"
                dir="ltr"
              >
                {group.currentQty.toLocaleString('en-US')}
              </p>
              <p className="text-[12px]" style={{ color: '#52B788' }}>
                {t('currentQuantity')}
              </p>
            </div>
            <div className="text-center">
              <p
                className="font-display text-[28px] text-white tabular-nums"
                dir="ltr"
              >
                {group.initialQty.toLocaleString('en-US')}
              </p>
              <p className="text-[12px]" style={{ color: '#52B788' }}>
                {t('initialQuantity')}
              </p>
            </div>
            <div className="text-center">
              <p
                className="font-display text-[28px] text-white tabular-nums"
                dir="ltr"
              >
                {group.daysActive.toLocaleString('en-US')}
              </p>
              <p className="text-[12px]" style={{ color: '#52B788' }}>
                {t('activeDays')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        className="flex gap-2 rounded-[10px] p-1"
        style={{ backgroundColor: '#F0EDE4' }}
      >
        {(
          [
            ['metrics', t('tabMetrics')],
            ['tasks', t('tabTasks')],
            ['reports', t('tabReports')],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`cursor-pointer rounded-[8px] px-4 py-1.5 text-[13px] font-medium ${
              activeTab === id ? 'bg-[#2D6A4F] text-white' : 'text-[#5C5852]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'metrics' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="font-display text-[22px]"
              style={{ color: '#2C2A24' }}
            >
              {t('groupMetrics')}
            </h2>
            <div
              className="flex rounded-[10px] p-1"
              style={{ backgroundColor: '#F0EDE4' }}
            >
              {(
                [
                  ['day', t('periodDay')],
                  ['week', t('periodWeek')],
                  ['month', t('periodMonth')],
                  ['year', t('periodYear')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPeriod(id)}
                  className={`cursor-pointer rounded-[8px] px-3 py-1 text-[12px] font-medium ${
                    period === id ? 'bg-[#2D6A4F] text-white' : 'text-[#5C5852]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-[16px] p-5"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow:
                '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
            }}
          >
            {metricsQuery.isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center gap-2">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: '#2D6A4F' }}
                />
                <span className="text-[13px]" style={{ color: '#5C5852' }}>
                  {t('loadingMetrics')}
                </span>
              </div>
            ) : metricsQuery.isError ? (
              <InlineError
                message={getApiErrorMessage(
                  metricsQuery.error,
                  t('errorMetrics'),
                )}
                onRetry={() => {
                  void metricsQuery.refetch();
                }}
              />
            ) : points.length === 0 ? (
              <EmptyState
                title={t('noMetricsTitle')}
                description={t('noMetricsDesc')}
                className="py-10"
              />
            ) : (
              <div className="h-[280px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points}>
                    <defs>
                      <linearGradient
                        id="workerGroupMetricFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2D6A4F"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#2D6A4F"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E4E0D8" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#5C5852', fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: '#5C5852', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        borderColor: '#E4E0D8',
                      }}
                      formatter={(value, _name, item) => [
                        String(value ?? ''),
                        (item?.payload as { metricName?: string } | undefined)
                          ?.metricName ?? t('value'),
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2D6A4F"
                      strokeWidth={2}
                      fill="url(#workerGroupMetricFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'tasks' ? (
        <section
          className="rounded-[16px] p-5"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow:
              '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
          }}
        >
          <h2
            className="mb-4 font-display text-[22px]"
            style={{ color: '#2C2A24' }}
          >
            {t('myTasksInGroup')}
          </h2>

          {tasksQuery.isLoading ? (
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ color: '#5C5852' }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loadingTasks')}
            </div>
          ) : tasksQuery.isError ? (
            <InlineError
              message={getApiErrorMessage(tasksQuery.error, t('errorTasks'))}
              onRetry={() => {
                void tasksQuery.refetch();
              }}
            />
          ) : tasks.length === 0 ? (
            <EmptyState
              title={t('noTasksTitle')}
              description={t('noTasksDesc')}
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-[10px] px-4 py-3"
                  style={{
                    backgroundColor: '#FAFAF7',
                    border: '1px solid #F0EDE4',
                  }}
                >
                  <p
                    className="text-[14px] font-medium"
                    style={{ color: '#2C2A24' }}
                  >
                    {task.title || t('unnamedTask')}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: '#5C5852' }}>
                    {formatDate(task.scheduled_date)} -{' '}
                    {formatTime(task.time_of_day)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'reports' ? (
        <section
          className="rounded-[16px] p-5"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow:
              '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
          }}
        >
          <h2
            className="mb-4 font-display text-[22px]"
            style={{ color: '#2C2A24' }}
          >
            {t('myReportsInGroup')}
          </h2>

          {reportsQuery.isLoading ? (
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ color: '#5C5852' }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loadingReports')}
            </div>
          ) : reportsQuery.isError ? (
            <InlineError
              message={getApiErrorMessage(
                reportsQuery.error,
                t('errorReports'),
              )}
              onRetry={() => {
                void reportsQuery.refetch();
              }}
            />
          ) : reports.length === 0 ? (
            <EmptyState
              title={t('noReportsTitle')}
              description={t('noReportsDesc')}
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const styles = (getReportStatusStyles(t) as any)[
                  (report.status ?? '').toLowerCase()
                ] ?? {
                  bg: '#F0EDE4',
                  color: '#5C5852',
                  label: report.status || t('unknown'),
                };

                return (
                  <div
                    key={report.id}
                    className="rounded-[10px] border-r-4 px-4 py-3"
                    style={{
                      borderRightColor: '#E76F51',
                      backgroundColor: '#FAFAF7',
                      border: '1px solid #F0EDE4',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px]" style={{ color: '#2C2A24' }}>
                        {report.description || t('noDescription')}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: styles.bg,
                          color: styles.color,
                        }}
                      >
                        {styles.label}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-[12px]"
                      style={{ color: '#5C5852' }}
                    >
                      {formatDate(report.created_at, true)} -{' '}
                      {report.type || t('general')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/worker/reports">{t('viewAllReports')}</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <p className="text-[12px]" style={{ color: '#9C9890' }}>
        {t('groupStartDate')} {group.startDate}
      </p>

      {(tasksQuery.isFetching ||
        reportsQuery.isFetching ||
        metricsQuery.isFetching) && (
        <div
          className="flex items-center gap-2 text-[12px]"
          style={{ color: '#9C9890' }}
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          {t('refreshingTabs')}
        </div>
      )}
    </div>
  );
}
