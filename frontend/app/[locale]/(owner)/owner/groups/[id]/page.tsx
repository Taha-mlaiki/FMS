'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  Pencil,
  RefreshCw,
  TrendingDown,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGroup, useUpdateGroup } from '@/lib/hooks/api/use-groups';
import { useMetrics } from '@/lib/hooks/api/use-metrics';
import { useOccurrences } from '@/lib/hooks/api/use-occurrences';
import { useReports } from '@/lib/hooks/api/use-reports';
import { usePermission } from '@/lib/hooks/use-permission';

/* ── Types ── */
type GroupTab = 'overview' | 'metrics' | 'tasks' | 'reports';
type DashboardPeriod = 'day' | 'week' | 'month' | 'year';
type GroupStatus = 'active' | 'sold' | 'closed';

type GroupViewModel = {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  breed: string;
  building: string;
  status: GroupStatus;
  currentQty: number;
  initialQty: number;
  mortality: number;
  mortalityRate: number;
  arrivalDate: string;
  arrivalDateFormatted: string;
  ageDays: number;
  createdAt: string;
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

type EditFormState = {
  name: string;
  type: string;
  breed: string;
  building: string;
  status: GroupStatus;
  arrivalDate: string;
};

/* ── Styles ── */
const statusStyles: Record<
  GroupStatus,
  { bg: string; color: string; label: string; dot: string }
> = {
  active: { bg: '#D8F3DC', color: '#0D2818', label: 'نشط', dot: '#2D6A4F' },
  sold: { bg: '#DBEAFE', color: '#1E40AF', label: 'مباع', dot: '#3B82F6' },
  closed: { bg: '#F3F4F6', color: '#374151', label: 'مغلق', dot: '#9CA3AF' },
};

const reportStatusStyles: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  open: { bg: '#FDDCB5', color: '#7A5C00', label: 'مفتوح' },
  in_review: { bg: '#DBEAFE', color: '#1E40AF', label: 'قيد المراجعة' },
  resolved: { bg: '#D8F3DC', color: '#1B4332', label: 'تم الحل' },
};

/* ── Helpers ── */
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

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
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

function toDateInputValue(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeStatus(value?: string): GroupStatus {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'sold' || normalized === 'closed') return normalized;
  return 'active';
}

function getTypeLabel(type?: string, species?: string): string {
  const source = (type || species || '').toLowerCase();
  if (source === 'broiler') return 'دجاج لاحم';
  if (source === 'layer') return 'دجاج بياض';
  if (source === 'duck') return 'بط';
  if (source === 'turkey') return 'ديك رومي';
  return type || species || 'غير محدد';
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

/* ── Data Normalizers ── */
function normalizeGroup(payload: unknown): GroupViewModel | null {
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
  const mortality = Math.max(initialQty - currentQty, 0);
  const mortalityRate = initialQty > 0 ? (mortality / initialQty) * 100 : 0;

  const backendAgeDays = toNumber(group.age_days ?? group.ageDays);
  let computedAgeDays = 0;
  if (arrivalDate) {
    const arrivalMs = new Date(arrivalDate).getTime();
    const nowMs = new Date().getTime();
    computedAgeDays = Math.max(
      Math.ceil((nowMs - arrivalMs) / (1000 * 60 * 60 * 24)),
      0,
    );
  }

  return {
    id,
    name: toString(group.name) || 'مجموعة بدون اسم',
    type: toString(group.type ?? group.species),
    typeLabel: getTypeLabel(toString(group.type), toString(group.species)),
    breed: toString(group.breed),
    building: toString(group.building),
    status: normalizeStatus(toString(group.status)),
    currentQty,
    initialQty,
    mortality,
    mortalityRate,
    arrivalDate,
    arrivalDateFormatted: formatDate(arrivalDate, true),
    ageDays: backendAgeDays > 0 ? backendAgeDays : computedAgeDays,
    createdAt: formatDate(toString(group.created_at ?? group.createdAt), true),
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

function chartPoints(records: MetricRecord[]) {
  return records
    .filter(
      (record) => typeof record.value !== 'undefined' && record.value !== null,
    )
    .map((record) => ({
      date: formatDate(record.date),
      value: toNumber(record.value),
      metricName: record.metricName || 'قياس',
    }));
}

/* ── Stat Card ── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: Readonly<{
  label: string;
  value: string;
  sub?: string;
  icon: typeof Users;
  color: string;
}>) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #F0EDE4' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-[12px] font-medium" style={{ color: '#9C9890' }}>
          {label}
        </span>
      </div>
      <p
        className="text-[22px] font-bold tabular-nums"
        style={{ color: '#2C2A24' }}
        dir="ltr"
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Page ── */
export default function OwnerGroupDetailPage() {
  const tCommon = useTranslations('common');
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const groupId =
    typeof rawId === 'string'
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0] || ''
        : '';

  const [activeTab, setActiveTab] = useState<GroupTab>('overview');
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    type: '',
    breed: '',
    building: '',
    status: 'active',
    arrivalDate: '',
  });

  const canUpdate = usePermission('update:group');
  const groupQuery = useGroup(groupId || null);
  const updateGroup = useUpdateGroup();
  const metricsQuery = useMetrics({ groupId, period });
  const tasksQuery = useOccurrences({ group_id: groupId, page: 1, limit: 20 });
  const reportsQuery = useReports({ group_id: groupId, page: 1, limit: 20 });

  const group = useMemo(
    () => normalizeGroup(groupQuery.data),
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
  const points = useMemo(() => chartPoints(metrics), [metrics]);

  function openEditDialog() {
    if (!group) return;
    setEditForm({
      name: group.name,
      type: group.type,
      breed: group.breed,
      building: group.building,
      status: group.status,
      arrivalDate: toDateInputValue(group.arrivalDate),
    });
    setIsEditOpen(true);
  }

  function closeEditDialog() {
    if (updateGroup.isPending) return;
    setIsEditOpen(false);
  }

  async function handleEditSubmit() {
    if (!group) return;

    const name = editForm.name.trim();
    if (!name) {
      toast.error('اسم المجموعة مطلوب');
      return;
    }

    await updateGroup.mutateAsync({
      id: group.id,
      data: {
        name,
        type: editForm.type,
        breed: editForm.breed,
        building: editForm.building,
        status: editForm.status,
        arrival_date: editForm.arrivalDate || undefined,
      },
    });

    await groupQuery.refetch();
    toast.success('تم تحديث بيانات المجموعة');
    closeEditDialog();
  }

  /* ── Loading ── */
  if (groupQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2">
        <Loader2
          className="h-5 w-5 animate-spin"
          style={{ color: '#2D6A4F' }}
        />
        <span className="text-[14px]" style={{ color: '#5C5852' }}>
          جارٍ تحميل بيانات المجموعة...
        </span>
      </div>
    );
  }

  /* ── Error ── */
  if (groupQuery.isError || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <p className="text-[15px] font-medium" style={{ color: '#5C5852' }}>
          {getApiErrorMessage(groupQuery.error, 'تعذر تحميل بيانات المجموعة.')}
        </p>
        <Button
          onClick={() => groupQuery.refetch()}
          variant="outline"
          className="rounded-xl h-10 px-4 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const status = statusStyles[group.status];
  const progress =
    group.initialQty > 0
      ? Math.min((group.currentQty / group.initialQty) * 100, 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 text-[13px]"
        style={{ color: '#9C9890' }}
      >
        <Link
          href="/owner/groups"
          className="hover:underline"
          style={{ color: '#2D6A4F' }}
        >
          المجموعات
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        <span style={{ color: '#2C2A24' }}>{group.name}</span>
      </div>

      {/* Header Section */}
      <section
        className="rounded-2xl px-6 py-6 sm:px-8"
        style={{ background: 'linear-gradient(135deg, #0D2818, #1B4332)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-[28px] text-white font-semibold">
                {group.name}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: status.dot }}
                />
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
              >
                {group.typeLabel}
              </span>
              {group.breed && (
                <span className="text-[13px] text-white/70">{group.breed}</span>
              )}
              {group.building && (
                <span className="flex items-center gap-1 text-[13px] text-white/70">
                  <Home className="w-3 h-3" />
                  {group.building}
                </span>
              )}
            </div>
          </div>

          {canUpdate && (
            <Button
              onClick={openEditDialog}
              variant="outline"
              className="rounded-xl border-white/20 text-white hover:bg-white/10 cursor-pointer"
            >
              <Pencil className="w-4 h-4 ml-2" />
              {tCommon('edit')}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between mb-1.5">
            <span className="text-[12px] text-white/60">نسبة البقاء</span>
            <span
              className="text-[12px] font-semibold text-white tabular-nums"
              dir="ltr"
            >
              {formatNumber(Math.round(progress))}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor:
                  progress > 80
                    ? '#52B788'
                    : progress > 50
                      ? '#D4A843'
                      : '#EF4444',
              }}
            />
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="العدد الحالي"
          value={formatNumber(group.currentQty)}
          icon={Users}
          color="#2D6A4F"
        />
        <StatCard
          label="العدد الأولي"
          value={formatNumber(group.initialQty)}
          icon={Users}
          color="#5C5852"
        />
        <StatCard
          label="النفوق"
          value={formatNumber(group.mortality)}
          sub={
            group.mortalityRate > 0
              ? `${formatNumber(Math.round(group.mortalityRate * 10) / 10)}%`
              : undefined
          }
          icon={TrendingDown}
          color="#EF4444"
        />
        <StatCard
          label="عمر المجموعة"
          value={`${formatNumber(group.ageDays)} يوم`}
          icon={Clock}
          color="#D4A843"
        />
      </div>

      {/* Detail Info Row */}
      <div
        className="rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #F0EDE4' }}
      >
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: '#9C9890' }}>
            تاريخ الوصول
          </p>
          <p className="text-[13px] font-medium" style={{ color: '#2C2A24' }}>
            {group.arrivalDateFormatted}
          </p>
        </div>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: '#9C9890' }}>
            السلالة
          </p>
          <p className="text-[13px] font-medium" style={{ color: '#2C2A24' }}>
            {group.breed || '-'}
          </p>
        </div>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: '#9C9890' }}>
            المبنى
          </p>
          <p className="text-[13px] font-medium" style={{ color: '#2C2A24' }}>
            {group.building || '-'}
          </p>
        </div>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: '#9C9890' }}>
            تاريخ الإنشاء
          </p>
          <p className="text-[13px] font-medium" style={{ color: '#2C2A24' }}>
            {group.createdAt}
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div
        className="flex gap-0.5 rounded-xl p-1"
        style={{ backgroundColor: '#F0EDE4' }}
      >
        {(
          [
            ['overview', 'نظرة عامة'],
            ['metrics', 'القياسات'],
            ['tasks', 'المهام'],
            ['reports', 'التقارير'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all ${
              activeTab === id
                ? 'bg-[#2D6A4F] text-white'
                : 'text-[#5C5852] hover:bg-white/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Mini Chart */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #F0EDE4',
            }}
          >
            <h3
              className="text-[16px] font-semibold mb-4"
              style={{ color: '#2C2A24' }}
            >
              آخر القياسات
            </h3>
            {metricsQuery.isLoading ? (
              <div className="flex items-center justify-center h-[180px] gap-2">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: '#2D6A4F' }}
                />
                <span className="text-[13px]" style={{ color: '#5C5852' }}>
                  تحميل...
                </span>
              </div>
            ) : points.length === 0 ? (
              <div className="flex items-center justify-center h-[180px]">
                <p className="text-[13px]" style={{ color: '#9C9890' }}>
                  لا توجد قياسات متاحة
                </p>
              </div>
            ) : (
              <div className="h-[180px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points.slice(-10)}>
                    <defs>
                      <linearGradient
                        id="ownerGroupMetricFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2D6A4F"
                          stopOpacity={0.3}
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
                      tick={{ fill: '#5C5852', fontSize: 10 }}
                    />
                    <YAxis tick={{ fill: '#5C5852', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        borderColor: '#E4E0D8',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2D6A4F"
                      strokeWidth={2}
                      fill="url(#ownerGroupMetricFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #F0EDE4',
            }}
          >
            <h3
              className="text-[16px] font-semibold mb-4"
              style={{ color: '#2C2A24' }}
            >
              آخر المهام
            </h3>
            {tasksQuery.isLoading ? (
              <div className="flex items-center justify-center h-[180px] gap-2">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: '#2D6A4F' }}
                />
                <span className="text-[13px]" style={{ color: '#5C5852' }}>
                  تحميل...
                </span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex items-center justify-center h-[180px]">
                <p className="text-[13px]" style={{ color: '#9C9890' }}>
                  لا توجد مهام مرتبطة
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor: '#FAFAF8',
                      border: '1px solid #F0EDE4',
                    }}
                  >
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: '#2C2A24' }}
                    >
                      {task.title || 'مهمة بدون عنوان'}
                    </p>
                    <p
                      className="mt-0.5 text-[11px]"
                      style={{ color: '#5C5852' }}
                    >
                      {formatDate(task.scheduled_date)} -{' '}
                      {formatTime(task.time_of_day)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab: Metrics */}
      {activeTab === 'metrics' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="font-display text-[20px] font-semibold"
              style={{ color: '#2C2A24' }}
            >
              قياسات المجموعة
            </h2>
            <div
              className="flex rounded-lg p-1"
              style={{ backgroundColor: '#F0EDE4' }}
            >
              {(
                [
                  ['day', 'يوم'],
                  ['week', 'أسبوع'],
                  ['month', 'شهر'],
                  ['year', 'سنة'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPeriod(id)}
                  className={`cursor-pointer rounded-md px-3 py-1 text-[12px] font-medium ${
                    period === id ? 'bg-[#2D6A4F] text-white' : 'text-[#5C5852]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #F0EDE4',
            }}
          >
            {metricsQuery.isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center gap-2">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: '#2D6A4F' }}
                />
                <span className="text-[13px]" style={{ color: '#5C5852' }}>
                  تحميل القياسات...
                </span>
              </div>
            ) : metricsQuery.isError ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                <p className="text-[13px]" style={{ color: '#5C5852' }}>
                  {getApiErrorMessage(
                    metricsQuery.error,
                    'تعذر تحميل القياسات.',
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => metricsQuery.refetch()}
                  className="cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 ml-1" />
                  إعادة المحاولة
                </Button>
              </div>
            ) : points.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <p className="text-[14px]" style={{ color: '#9C9890' }}>
                  لا توجد بيانات قياس متاحة للفترة المحددة.
                </p>
              </div>
            ) : (
              <div className="h-[300px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points}>
                    <defs>
                      <linearGradient
                        id="ownerMetricFill"
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
                          ?.metricName ?? 'القيمة',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2D6A4F"
                      strokeWidth={2}
                      fill="url(#ownerMetricFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab: Tasks */}
      {activeTab === 'tasks' && (
        <section
          className="rounded-xl p-5"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #F0EDE4',
          }}
        >
          <h2
            className="mb-4 font-display text-[20px] font-semibold"
            style={{ color: '#2C2A24' }}
          >
            المهام المرتبطة
          </h2>

          {tasksQuery.isLoading ? (
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ color: '#5C5852' }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              تحميل المهام...
            </div>
          ) : tasksQuery.isError ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <p className="text-[13px]" style={{ color: '#5C5852' }}>
                {getApiErrorMessage(tasksQuery.error, 'تعذر تحميل المهام.')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => tasksQuery.refetch()}
                className="cursor-pointer"
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-[14px]" style={{ color: '#9C9890' }}>
                لا توجد مهام مرتبطة بهذه المجموعة حالياً.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: '#FAFAF8',
                    border: '1px solid #F0EDE4',
                  }}
                >
                  <p
                    className="text-[14px] font-medium"
                    style={{ color: '#2C2A24' }}
                  >
                    {task.title || 'مهمة بدون عنوان'}
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
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <section
          className="rounded-xl p-5"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #F0EDE4',
          }}
        >
          <h2
            className="mb-4 font-display text-[20px] font-semibold"
            style={{ color: '#2C2A24' }}
          >
            التقارير
          </h2>

          {reportsQuery.isLoading ? (
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ color: '#5C5852' }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              تحميل التقارير...
            </div>
          ) : reportsQuery.isError ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <p className="text-[13px]" style={{ color: '#5C5852' }}>
                {getApiErrorMessage(reportsQuery.error, 'تعذر تحميل التقارير.')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reportsQuery.refetch()}
                className="cursor-pointer"
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-[14px]" style={{ color: '#9C9890' }}>
                لم يتم تسجيل تقارير لهذه المجموعة بعد.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const styles = reportStatusStyles[
                  (report.status ?? '').toLowerCase()
                ] ?? {
                  bg: '#F0EDE4',
                  color: '#5C5852',
                  label: report.status || 'غير معروف',
                };

                return (
                  <div
                    key={report.id}
                    className="rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: '#FAFAF8',
                      border: '1px solid #F0EDE4',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px]" style={{ color: '#2C2A24' }}>
                        {report.description || 'بدون وصف'}
                      </p>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
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
                      {report.type || 'عام'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Refresh indicator */}
      {(tasksQuery.isFetching ||
        reportsQuery.isFetching ||
        metricsQuery.isFetching) && (
        <div
          className="flex items-center gap-2 text-[12px]"
          style={{ color: '#9C9890' }}
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          تحديث البيانات...
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(nextOpen) => !nextOpen && closeEditDialog()}
      >
        <DialogContent dir="rtl" className="max-w-[520px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              تعديل المجموعة
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              تعديل جميع بيانات المجموعة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <p
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                الاسم
              </p>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={updateGroup.isPending}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: '#2C2A24' }}
                >
                  النوع
                </p>
                <Select
                  value={editForm.type}
                  onValueChange={(v) =>
                    setEditForm((prev) => ({ ...prev, type: v }))
                  }
                  disabled={updateGroup.isPending}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="broiler">دجاج لاحم</SelectItem>
                    <SelectItem value="layer">دجاج بياض</SelectItem>
                    <SelectItem value="turkey">ديك رومي</SelectItem>
                    <SelectItem value="duck">بط</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: '#2C2A24' }}
                >
                  السلالة
                </p>
                <Input
                  value={editForm.breed}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, breed: e.target.value }))
                  }
                  placeholder="مثال: Cobb 500"
                  disabled={updateGroup.isPending}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: '#2C2A24' }}
                >
                  الحالة
                </p>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm((prev) => ({
                      ...prev,
                      status: v as GroupStatus,
                    }))
                  }
                  disabled={updateGroup.isPending}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="sold">مباع</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: '#2C2A24' }}
                >
                  المبنى
                </p>
                <Input
                  value={editForm.building}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      building: e.target.value,
                    }))
                  }
                  placeholder="مثال: حظيرة A"
                  disabled={updateGroup.isPending}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                تاريخ البداية
              </p>
              <Input
                type="date"
                value={editForm.arrivalDate}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    arrivalDate: e.target.value,
                  }))
                }
                disabled={updateGroup.isPending}
                className="rounded-xl"
              />
            </div>

            <p className="text-[12px]" style={{ color: '#9C9890' }}>
              الكمية الأولية غير قابلة للتعديل بعد إنشاء المجموعة.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={updateGroup.isPending}
              className="cursor-pointer rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                void handleEditSubmit();
              }}
              disabled={updateGroup.isPending}
              className="cursor-pointer rounded-xl"
              style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
            >
              {updateGroup.isPending ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
