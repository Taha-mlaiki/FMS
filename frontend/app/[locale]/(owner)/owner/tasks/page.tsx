'use client';

import { useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Plus,
  Clock,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Circle,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Users,
  Layers,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TaskOccurrenceDetailModal } from '@/app/[locale]/(owner)/_components/modals/task-detail-modal';
import { CreateTaskTemplateDialog } from '@/app/[locale]/(owner)/owner/tasks/_components/create-task-template-dialog';
import { TemplatesTab } from '@/app/[locale]/(owner)/owner/tasks/_components/templates-tab';
import {
  useCompleteOccurrence,
  useOccurrences,
  useSkipOccurrence,
} from '@/lib/hooks/api/use-occurrences';
import { useTaskTemplates } from '@/lib/hooks/api/use-tasks';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { usePermission } from '@/lib/hooks/use-permission';
import { useTaskStore } from '@/lib/stores/task.store';
import type { FilterStatus, ViewMode, TaskTab } from '@/lib/stores/task.store';

/* ── Types ── */
type TaskStatus = 'todo' | 'doing' | 'completed' | 'skipped';

const priorityColors: Record<string, string> = {
  low: '#9C9890',
  medium: '#F4A261',
  high: '#E76F51',
  critical: '#DC2626',
};

type ApiOccurrence = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  recurrence?: string;
  category?: string;
  category_id?: string;
  categoryId?: string;
  category_name?: string;
  categoryName?: string;
  category_color?: string;
  categoryColor?: string;
  time_of_day?: string;
  timeOfDay?: string;
  scheduled_date?: string;
  scheduledDate?: string;
  notes?: string;
  completed_at?: string;
  completedAt?: string;
  completed_by?: string;
  completedBy?: string;
  report_id?: string;
  reportId?: string;
  group_ids?: string[];
  groupIds?: string[];
  worker_ids?: string[];
  workerIds?: string[];
  workers?: Array<{ id: string; name: string }>;
  groups?: Array<{ id: string; name: string }>;
  group_names?: string[];
  groupNames?: string[];
  worker_names?: string[];
  workerNames?: string[];
  materials?: MaterialItem[];
};

type TaskTemplate = {
  id: string;
};

type MaterialItem = {
  material_id?: string;
  materialId?: string;
  material_name?: string;
  materialName?: string;
  quantity: number;
  unit: string;
};

type TaskViewModel = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: string;
  category: string;
  categoryName?: string;
  categoryColor?: string;
  time: string;
  date: string;
  groups: Array<{ id: string; name: string }>;
  workers: Array<{ id: string; name: string }>;
};

type ModalWorker = { name: string; initial: string };

type TaskModalModel = {
  id: string;
  title: string;
  status: TaskStatus;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  groups: Array<{ id: string; name: string }>;
  workers: ModalWorker[];
  materials?: MaterialItem[];
  report_id?: string;
  completedBy?: string;
  completedAt?: string;
  skipNote?: string;
};

/* ── Helpers ── */

function getTaskStatus(value?: string): TaskStatus {
  const normalized = value?.toUpperCase();
  if (normalized === 'DONE' || normalized === 'COMPLETED') return 'completed';
  if (normalized === 'SKIPPED') return 'skipped';
  if (normalized === 'DOING') return 'doing';
  return 'todo';
}

function formatTime(value?: string): string {
  if (!value) return '--:--';
  return value.slice(0, 5);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-CA').format(date);
}

function formatMonthTitle(value: Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function formatSectionLabelIntl(
  isoDate: string,
  todayLabel: string,
  tomorrowLabel: string,
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const weekdayAndDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(target);

  if (target.getTime() === today.getTime()) return `${todayLabel} - ${weekdayAndDate}`;
  if (target.getTime() === tomorrow.getTime())
    return `${tomorrowLabel} - ${weekdayAndDate}`;

  return weekdayAndDate;
}

function extractGroupNames(value: ApiOccurrence): string[] {
  if (Array.isArray(value.group_names)) {
    return value.group_names.filter((name): name is string => Boolean(name));
  }
  if (Array.isArray(value.groups)) {
    return value.groups
      .map((group) => {
        if (typeof group === 'string') return group;
        return group?.name ?? '';
      })
      .filter((name): name is string => Boolean(name));
  }
  const ids = value.group_ids || value.groupIds;
  if (Array.isArray(ids)) {
    return ids.filter(Boolean);
  }
  return [];
}

function toDisplayDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function toDisplayDateTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function buildInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function extractWorkerNames(value: ApiOccurrence): string[] {
  if (Array.isArray(value.worker_names)) {
    return value.worker_names.filter((name): name is string => Boolean(name));
  }
  if (Array.isArray(value.workers)) {
    return value.workers
      .map((worker) => {
        if (typeof worker === 'string') return worker;
        return worker?.name ?? worker?.id ?? '';
      })
      .filter((name): name is string => Boolean(name));
  }
  const ids = value.worker_ids || value.workerIds;
  if (Array.isArray(ids)) {
    return ids.filter((id): id is string => Boolean(id));
  }
  return [];
}

function extractMaterials(value: ApiOccurrence): MaterialItem[] {
  if (!Array.isArray(value.materials)) return [];
  return value.materials
    .map((m) => ({
      material_id: m.material_id ?? m.materialId ?? '',
      material_name: m.material_name ?? m.materialName ?? '',
      quantity: typeof m.quantity === 'number' ? m.quantity : 0,
      unit: m.unit ?? '',
    }))
    .filter((m) => m.material_id || m.material_name);
}

function normalizeOccurrenceDetail(payload: unknown): ApiOccurrence | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const source = payload as Record<string, unknown>;
  if (typeof source.occurrence === 'object' && source.occurrence !== null) {
    return source.occurrence as ApiOccurrence;
  }
  if (typeof source.data === 'object' && source.data !== null) {
    return source.data as ApiOccurrence;
  }
  return source as ApiOccurrence;
}

function mapOccurrenceToModalTask(
  occurrence: ApiOccurrence,
  fallback: TaskViewModel | undefined,
  untitledLabel: string,
): TaskModalModel {
  const workers = (occurrence.workers || []).map((w) => ({
    name: w.name,
    initial: buildInitial(w.name),
  }));

  const occTime = occurrence.time_of_day || occurrence.timeOfDay;
  const occDate = occurrence.scheduled_date || occurrence.scheduledDate;

  return {
    id: occurrence.id,
    title: occurrence.title || fallback?.title || untitledLabel,
    status: getTaskStatus(occurrence.status),
    scheduledDate: toDisplayDate(occDate || fallback?.date),
    scheduledTime: formatTime(occTime || fallback?.time),
    description: occurrence.description || fallback?.description,
    groups: occurrence.groups || fallback?.groups || [],
    workers,
    materials: extractMaterials(occurrence),
    report_id: occurrence.report_id || occurrence.reportId,
    completedBy: occurrence.completed_by || occurrence.completedBy,
    completedAt: toDisplayDateTime(
      occurrence.completed_at || occurrence.completedAt,
    ),
    skipNote:
      getTaskStatus(occurrence.status) === 'skipped' ? occurrence.notes : '',
  };
}

function mapViewTaskToModalTask(task: TaskViewModel): TaskModalModel {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    scheduledDate: toDisplayDate(task.date),
    scheduledTime: task.time,
    description: task.description,
    groups: task.groups,
    workers: (task.workers || []).map((w) => ({
      name: w.name,
      initial: buildInitial(w.name),
    })),
  };
}

function normalizeOccurrences(payload: unknown): {
  list: ApiOccurrence[];
  total: number;
} {
  if (Array.isArray(payload)) {
    return { list: payload as ApiOccurrence[], total: payload.length };
  }
  if (typeof payload !== 'object' || payload === null) {
    return { list: [], total: 0 };
  }
  const source = payload as Record<string, unknown>;
  let listSource: unknown[] = [];
  if (Array.isArray(source.tasks)) {
    listSource = source.tasks;
  } else if (Array.isArray(source.occurrences)) {
    listSource = source.occurrences;
  } else if (Array.isArray(source.data)) {
    listSource = source.data;
  }
  const list = listSource as ApiOccurrence[];
  const total =
    typeof source.total === 'number' && Number.isFinite(source.total)
      ? source.total
      : list.length;
  return { list, total };
}

function normalizeTemplates(payload: unknown): {
  list: TaskTemplate[];
  total: number;
} {
  if (Array.isArray(payload)) {
    return { list: payload as TaskTemplate[], total: payload.length };
  }
  if (typeof payload !== 'object' || payload === null) {
    return { list: [], total: 0 };
  }
  const source = payload as Record<string, unknown>;
  let listSource: unknown[] = [];
  if (Array.isArray(source.tasks)) {
    listSource = source.tasks;
  } else if (Array.isArray(source.templates)) {
    listSource = source.templates;
  } else if (Array.isArray(source.data)) {
    listSource = source.data;
  }
  const list = listSource as TaskTemplate[];
  const total =
    typeof source.total === 'number' && Number.isFinite(source.total)
      ? source.total
      : list.length;
  return { list, total };
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
  sessionExpiredMsg: string,
  noPermissionMsg: string,
  notFoundMsg: string,
): string {
  if (typeof error !== 'object' || error === null) return fallback;
  const maybeError = error as {
    response?: { data?: { message?: string | string[] }; status?: number };
  };
  const message = maybeError.response?.data?.message;
  if (Array.isArray(message) && message.length > 0)
    return message[0] ?? fallback;
  if (typeof message === 'string' && message.trim()) return message;
  switch (maybeError.response?.status) {
    case 401:
      return sessionExpiredMsg;
    case 403:
      return noPermissionMsg;
    case 404:
      return notFoundMsg;
    default:
      return fallback;
  }
}

const PAGE_SIZE = 20;

/* ── Task Card ── */
function TaskCard({
  task,
  onClick,
}: Readonly<{ task: TaskViewModel; onClick?: (task: TaskViewModel) => void }>) {
  const t = useTranslations('tasks');
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig: Record<
    TaskStatus,
    { dot: string; bg: string; label: string; icon: typeof Circle; glowClass?: string }
  > = {
    todo: { dot: '#9C9890', bg: '#F0EDE4', label: t('statusConfig.todo'), icon: Circle },
    doing: {
      dot: '#E76F51',
      bg: '#FFF4EF',
      label: t('statusConfig.doing', { defaultMessage: 'قيد التنفيذ' }),
      icon: Clock,
      glowClass: 'animate-glow-doing',
    },
    completed: {
      dot: '#2D6A4F',
      bg: '#D8F3DC',
      label: t('statusConfig.completed'),
      icon: CheckCircle2,
    },
    skipped: {
      dot: '#B0ADA5',
      bg: '#F0EDE4',
      label: t('statusConfig.skipped'),
      icon: SkipForward,
    },
  };

  const st = statusConfig[task.status] ?? statusConfig.todo;
  const StatusIcon = st.icon;
  const priorityColor = priorityColors[task.priority] ?? '#9C9890';

  const isDone = task.status === 'completed' || task.status === 'skipped';
  const isDoing = task.status === 'doing';

  // Helper to ensure we have the objects for groups/workers
  const groups = Array.isArray(task.groups) ? task.groups : [];
  const workers = Array.isArray(task.workers) ? task.workers : [];

  return (
    <div
      className={`w-full text-right flex flex-col rounded-2xl transition-all duration-500 glass-card group overflow-hidden border border-white/40 shadow-sm ${
        isDoing ? 'ring-2 ring-amber-500/30 ' + st.glowClass : ''
      } ${isDone ? 'opacity-80 grayscale-[0.3]' : 'hover:shadow-xl hover:-translate-y-1 hover:bg-white/50'}`}
    >
      {/* Header Button (Click to Expand) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 px-5 py-5 cursor-pointer hover:bg-white/40 transition-all duration-300 relative"
      >
        {/* Category Side Strip */}
        {task.categoryColor && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-1.5 opacity-80"
            style={{ backgroundColor: task.categoryColor }}
          />
        )}

        {/* Status Indicator with Animation */}
        <div className="relative shrink-0">
          {isDoing && (
            <div className="absolute inset-0 rounded-full animate-ping bg-amber-500/20" />
          )}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 shadow-inner transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundColor: st.bg }}
          >
            <StatusIcon
              className={`w-6 h-6 ${isDoing ? 'animate-pulse' : ''}`}
              style={{ color: st.dot }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-[17px] font-bold tracking-tight transition-all duration-300 ${
                isDone ? 'line-through text-neutral-400' : 'text-neutral-900 group-hover:text-brand-700'
              }`}
            >
              {task.title}
            </p>
            
            {/* Category Badge */}
            {task.categoryName && (
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border shadow-sm"
                style={{ 
                  backgroundColor: task.categoryColor ? `${task.categoryColor}15` : '#F0F0F0',
                  color: task.categoryColor || '#666',
                  borderColor: task.categoryColor ? `${task.categoryColor}30` : '#E0E0E0'
                }}
              >
                {task.categoryName}
              </span>
            )}

            {!isDone && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm animate-pulse"
                style={{ backgroundColor: priorityColor }}
              />
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1.5">
            {task.description && !isExpanded && (
              <p className="text-[13px] truncate text-neutral-500 max-w-[200px] leading-none">
                {task.description}
              </p>
            )}
            
            {/* Quick Count Indicators */}
            <div className="flex items-center gap-2">
              {groups.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                  <Layers className="w-3 h-3" />
                  <span>{groups.length}</span>
                </div>
              )}
              {workers.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                  <Users className="w-3 h-3" />
                  <span>{workers.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action/Time Info */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 border border-white/80 shadow-sm backdrop-blur-md"
          >
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-mono text-[13px] font-black text-neutral-700">
              {task.time}
            </span>
          </div>
          <div className="transition-all duration-300 transform group-hover:translate-x-1">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-brand-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-4 border-t border-neutral-100/50 bg-gradient-to-b from-white/20 to-white/40 backdrop-blur-md flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {task.description && (
            <div className="space-y-2">
               <p className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">{t('taskDescription')}</p>
               <p className="text-[14px] leading-relaxed text-neutral-700 bg-white/60 p-4 rounded-2xl border border-white/80 shadow-inner">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Groups */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100 shadow-sm">
                  <Layers className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-[13px] font-bold text-neutral-700">
                  {t('groupsLabel')}
                </p>
                <span className="text-[11px] bg-brand-100/50 text-brand-700 px-2 py-0.5 rounded-full font-black border border-brand-200">
                  {groups.length}
                </span>
              </div>
              {groups.length > 0 ? (
                <div className="flex flex-wrap gap-2 pr-2">
                  {groups.map((group) => (
                    <span
                      key={group.id}
                      className="text-[12px] px-4 py-1.5 rounded-xl bg-white/80 text-brand-800 border border-white shadow-sm font-semibold hover:bg-brand-50 transition-colors cursor-default"
                    >
                      {group.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] italic text-neutral-400 px-2">{t('noGroups')}</p>
              )}
            </div>

            {/* Workers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[13px] font-bold text-neutral-700">
                  {t('workersLabel')}
                </p>
                <span className="text-[11px] bg-blue-100/50 text-blue-700 px-2 py-0.5 rounded-full font-black border border-blue-200">
                  {workers.length}
                </span>
              </div>
              {workers.length > 0 ? (
                <div className="flex flex-wrap gap-2 pr-2">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 text-blue-800 border border-white shadow-sm font-semibold hover:bg-blue-50 transition-all"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-black">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[12px]">{worker.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] italic text-neutral-400 px-2">{t('noWorkers')}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 mt-2 border-t border-neutral-100/50">
            <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.date}</span>
            </div>
            
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(task);
              }}
              className="h-11 px-8 gap-3 text-[14px] font-black rounded-2xl shadow-lg transition-all hover:scale-[1.05] hover:shadow-brand-200 active:scale-[0.95] cursor-pointer group"
              style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
            >
              {t('openDetailsAction')}
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Pagination ── */
function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: Readonly<{
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}>) {
  const t = useTranslations('tasks');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0EDE4]"
        style={{ color: '#5C5852' }}
      >
        <ChevronRight className="w-4 h-4" />
        {t('pagination.previous')}
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => {
            if (p === 1 || p === totalPages) return true;
            if (Math.abs(p - page) <= 1) return true;
            return false;
          })
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) {
              acc.push(-1);
            }
            acc.push(p);
            return acc;
          }, [] as number[])
          .map((p, idx) =>
            p === -1 ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-[13px]"
                style={{ color: '#9C9890' }}
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                  p === page ? 'text-white' : 'hover:bg-[#F0EDE4]'
                }`}
                style={{
                  backgroundColor: p === page ? '#2D6A4F' : 'transparent',
                  color: p === page ? '#FFFFFF' : '#5C5852',
                }}
              >
                {p}
              </button>
            ),
          )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0EDE4]"
        style={{ color: '#5C5852' }}
      >
        {t('pagination.next')}
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Calendar View ── */
function CalendarView({
  monthDate,
  taskCounts,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Readonly<{
  monthDate: Date;
  taskCounts: Record<string, number>;
  selectedDate?: string;
  onSelectDate?: (isoDate: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}>) {
  const t = useTranslations('tasks');
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  const weekDays = [
    t('calendarWeekdaysOrdered.sun'),
    t('calendarWeekdaysOrdered.mon'),
    t('calendarWeekdaysOrdered.tue'),
    t('calendarWeekdaysOrdered.wed'),
    t('calendarWeekdaysOrdered.thu'),
    t('calendarWeekdaysOrdered.fri'),
    t('calendarWeekdaysOrdered.sat'),
  ];

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow:
          '0 1px 3px rgba(15,14,12,0.05), 0 2px 8px rgba(15,14,12,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-[#F0EDE4] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" style={{ color: '#5C5852' }} />
        </button>
        <h3
          className="font-display text-[18px] font-semibold"
          style={{ color: '#2C2A24' }}
        >
          {formatMonthTitle(monthDate)}
        </h3>
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-[#F0EDE4] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: '#5C5852' }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(
          (day) => (
            <div
              key={day}
              className="text-center text-[12px] uppercase font-medium py-2"
              style={{ color: '#9C9890' }}
            >
              {day}
            </div>
          ),
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - leadingDays + 1;
          const isCurrentMonth = day > 0 && day <= daysInMonth;
          const cellDate = isCurrentMonth
            ? new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
            : null;

          const today = new Date();
          const isToday = cellDate
            ? cellDate.getDate() === today.getDate() &&
              cellDate.getMonth() === today.getMonth() &&
              cellDate.getFullYear() === today.getFullYear()
            : false;

          const isoDate = cellDate
            ? formatDate(
                `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`,
              )
            : '';
          const taskCount = isoDate ? (taskCounts[isoDate] ?? 0) : 0;
          const hasTasks = taskCount > 0;
          const isSelected = Boolean(isoDate && selectedDate === isoDate);

          let cellBackground = 'transparent';
          if (isToday) {
            cellBackground = '#F0FAF3';
          } else if (hasTasks && isCurrentMonth) {
            cellBackground = '#FAFAF7';
          }

          return (
            <button
              key={i}
              type="button"
              className={`min-h-17.5 rounded-md p-2 transition-colors text-right ${
                isCurrentMonth
                  ? 'cursor-pointer hover:bg-[#F0EDE4]'
                  : 'cursor-default'
              }`}
              style={{ backgroundColor: cellBackground }}
              onClick={() => {
                if (!isCurrentMonth || !isoDate) return;
                onSelectDate?.(isoDate);
              }}
              disabled={!isCurrentMonth}
            >
              {isCurrentMonth && (
                <>
                  <span
                    className={`text-[13px] font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday || isSelected ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor:
                        isToday || isSelected ? '#2D6A4F' : 'transparent',
                      color: isToday || isSelected ? '#FFFFFF' : '#2C2A24',
                    }}
                  >
                    {day}
                  </span>
                  {hasTasks && (
                    <span
                      className="inline-flex items-center justify-center min-w-5 h-5 mt-1 px-1 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}
                    >
                      {taskCount}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Tab Button ── */
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  icon: typeof ClipboardList;
  label: string;
  count?: number;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-all duration-200 cursor-pointer border-b-2 ${
        active
          ? 'border-[#2D6A4F] text-[#2D6A4F]'
          : 'border-transparent text-[#9C9890] hover:text-[#5C5852] hover:border-[#E4E0D8]'
      }`}
    >
      <Icon className="w-4.5 h-4.5" />
      {label}
      {count !== undefined && count > 0 && (
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: active ? '#D8F3DC' : '#F0EDE4',
            color: active ? '#1B4332' : '#5C5852',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Page ── */
function TasksPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('tasks');
  const tc = useTranslations('common');

  // Zustand store
  const {
    activeTab,
    setActiveTab,
    viewMode: view,
    setViewMode,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    selectedOccurrenceId,
    setSelectedOccurrenceId,
    selectedCalendarDate,
    setSelectedCalendarDate,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    editingTemplate,
    closeEditDialog,
  } = useTaskStore();

  // Module-level objects moved inside component for i18n
  const statusConfig: Record<
    TaskStatus,
    { dot: string; bg: string; label: string; icon: typeof Circle }
  > = {
    todo: { dot: '#9C9890', bg: '#F0EDE4', label: t('statusConfig.todo'), icon: Circle },
    doing: { dot: '#E76F51', bg: '#FFF4EF', label: t('statusConfig.doing', { defaultMessage: 'قيد التنفيذ' }), icon: Clock },
    completed: {
      dot: '#2D6A4F',
      bg: '#D8F3DC',
      label: t('statusConfig.completed'),
      icon: CheckCircle2,
    },
    skipped: {
      dot: '#B0ADA5',
      bg: '#F0EDE4',
      label: t('statusConfig.skipped'),
      icon: SkipForward,
    },
  };

  const filterLabels: Record<FilterStatus, string> = {
    all: t('filterLabels.all'),
    todo: t('filterLabels.todo'),
    completed: t('filterLabels.completed'),
    skipped: t('filterLabels.skipped'),
  };

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { user } = useFarmContext();
  const groupIdFilter = searchParams.get('group_id')?.trim() || undefined;
  const canCreateTemplate = usePermission('create:task-template');
  const canCompleteTask = usePermission('complete:task');
  const canSkipTask = usePermission('skip:task');

  const monthStart = useMemo(
    () =>
      formatDate(
        `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`,
      ),
    [monthDate],
  );

  const monthEnd = useMemo(() => {
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    return formatDate(
      `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
    );
  }, [monthDate]);

  const calendarOccurrencesQuery = useOccurrences({
    page: 1,
    limit: 500,
    status: statusFilter === 'all' ? undefined : statusFilter,
    groupId: groupIdFilter,
    recurrence: 'once',
    startDate: monthStart,
    endDate: monthEnd,
  });

  const listOccurrencesQuery = useOccurrences({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === 'all' ? undefined : statusFilter,
    groupId: groupIdFilter,
    recurrence: 'once',
    startDate: monthStart,
    endDate: monthEnd,
  });

  const occurrencesQuery =
    view === 'calendar' ? calendarOccurrencesQuery : listOccurrencesQuery;

  const templatesQuery = useTaskTemplates({ page: 1, limit: 1, recurrence: 'recurring' });
  const completeOccurrence = useCompleteOccurrence();
  const skipOccurrence = useSkipOccurrence();

  const occurrences = useMemo(
    () => normalizeOccurrences(occurrencesQuery.data),
    [occurrencesQuery.data],
  );

  const templates = useMemo(
    () => normalizeTemplates(templatesQuery.data),
    [templatesQuery.data],
  );

  const tasks = useMemo<TaskViewModel[]>(
    () =>
      occurrences.list.map((item) => {
        const itemTime = item.time_of_day || item.timeOfDay;
        const itemDate = item.scheduled_date || item.scheduledDate;
        // Map groups string names to the expected format
        const groupNames = extractGroupNames(item);
        const viewModelGroups = groupNames.map((name, index) => ({
          id: item.group_ids?.[index] || item.groupIds?.[index] || `group-${index}`,
          name
        }));

        // Map worker string names to the expected format
        const workerNames = extractWorkerNames(item);
        const viewModelWorkers = workerNames.map((name, index) => ({
          id: item.worker_ids?.[index] || item.workerIds?.[index] || `worker-${index}`,
          name
        }));

        return {
          id: item.id,
          title: item.title || tc('untitledTask'),
          description: item.description || '',
          status: getTaskStatus(item.status),
          priority: item.priority || 'medium',
          category: item.category || item.category_name || item.categoryName || '',
          categoryName: item.category_name || item.categoryName || '',
          categoryColor: item.category_color || item.categoryColor || '',
          time: formatTime(itemTime),
          date: itemDate ? formatDate(itemDate) : '',
          groups: viewModelGroups,
          workers: viewModelWorkers,
        };
      }),
    [occurrences.list, tc],
  );

  const stats = useMemo(() => {
    const all = tasks.length;
    const todo = tasks.filter((tsk) => tsk.status === 'todo').length;
    const completed = tasks.filter((tsk) => tsk.status === 'completed').length;
    return { all, todo, completed };
  }, [tasks]);

  const selectedListTask = useMemo(
    () => tasks.find((task) => task.id === selectedOccurrenceId),
    [selectedOccurrenceId, tasks],
  );

  const selectedOccurrenceDetail = useMemo(
    () => occurrences.list.find((occ) => occ.id === selectedOccurrenceId) ?? null,
    [selectedOccurrenceId, occurrences.list],
  );

  const selectedModalTask = useMemo(() => {
    if (selectedOccurrenceDetail) {
      return mapOccurrenceToModalTask(
        selectedOccurrenceDetail,
        selectedListTask,
        tc('untitledTask'),
      );
    }
    if (selectedListTask) {
      return mapViewTaskToModalTask(selectedListTask);
    }
    return undefined;
  }, [selectedListTask, selectedOccurrenceDetail, tc]);

  const sections = useMemo(() => {
    const grouped = new Map<string, TaskViewModel[]>();
    tasks.forEach((task) => {
      const key = task.date || 'undated';
      const existing = grouped.get(key) ?? [];
      grouped.set(key, [...existing, task]);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => {
        if (a === 'undated') return 1;
        if (b === 'undated') return -1;
        return a.localeCompare(b);
      })
      .map(([date, dateTasks]) => ({
        date,
        label: date === 'undated'
          ? t('undatedSection')
          : formatSectionLabelIntl(date, t('todayLabel'), t('tomorrowLabel')),
        tasks: dateTasks,
      }));
  }, [tasks, t]);

  const effectiveSelectedCalendarDate = useMemo(() => {
    if (tasks.length === 0) return null;
    const hasSelectedDate = tasks.some(
      (task) => task.date && task.date === selectedCalendarDate,
    );
    if (hasSelectedDate) return selectedCalendarDate;
    const firstDatedTask = tasks.find((task) => Boolean(task.date));
    return firstDatedTask?.date ?? null;
  }, [selectedCalendarDate, tasks]);

  const taskCountsByDate = useMemo(() => {
    const calendarOccurrences = normalizeOccurrences(
      calendarOccurrencesQuery.data,
    );
    const counts: Record<string, number> = {};
    calendarOccurrences.list.forEach((item) => {
      const date = item.scheduled_date ? formatDate(item.scheduled_date) : '';
      if (!date) return;
      counts[date] = (counts[date] ?? 0) + 1;
    });
    return counts;
  }, [calendarOccurrencesQuery.data]);

  const calendarTasksForSelectedDate = useMemo(() => {
    if (!effectiveSelectedCalendarDate) return [];
    return tasks
      .filter((task) => task.date === effectiveSelectedCalendarDate)
      .sort((first, second) => first.time.localeCompare(second.time));
  }, [effectiveSelectedCalendarDate, tasks]);

  const isLoading = occurrencesQuery.isLoading;
  const isError = occurrencesQuery.isError;
  const hasTasks = sections.length > 0;

  const tasksError = getApiErrorMessage(
    occurrencesQuery.error,
    t('loadErrorDefault'),
    t('errorSessionExpired'),
    t('errorNoPermission'),
    t('errorNotFound'),
  );

  const handlePrevMonth = () => {
    setMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
    setPage(1);
  };

  const handleNextMonth = () => {
    setMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
    setPage(1);
  };

  const handleFilterChange = (filter: FilterStatus) => {
    setStatusFilter(filter);
  };

  const handleOpenTaskDetail = (task: TaskViewModel) => {
    setSelectedOccurrenceId(task.id);
  };

  const handleCloseTaskDetail = () => {
    setSelectedOccurrenceId(null);
  };

  const actorName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    undefined;

  const handleCompleteTask = async (payload: {
    notes?: string;
    report: {
      title: string;
      description: string;
      type: string;
      severity: string;
      group_id?: string;
    };
    materials_used?: Array<{ material_id: string; quantity: number }>;
  }) => {
    if (!selectedOccurrenceId) return false;
    try {
      await completeOccurrence.mutateAsync({
        id: selectedOccurrenceId,
        data: {
          notes: payload.notes,
          report: payload.report,
          materials_used: payload.materials_used,
        },
      });
      toast.success(t('completeSuccessMsg'));
      return true;
    } catch (error) {
      toast.error(t('completeErrorMsg'), {
        description: getApiErrorMessage(
          error,
          t('completeErrorHint'),
          t('errorSessionExpired'),
          t('errorNoPermission'),
          t('errorNotFound'),
        ),
      });
      return false;
    }
  };

  const handleSkipTask = async (payload: { reason?: string }) => {
    if (!selectedOccurrenceId) return false;
    try {
      await skipOccurrence.mutateAsync({
        id: selectedOccurrenceId,
        data: {
          reason: payload.reason,
          skipped_by: actorName,
        },
      });
      toast.success(t('skipSuccessMsg'));
      return true;
    } catch (error) {
      toast.error(t('skipErrorMsg'), {
        description: getApiErrorMessage(
          error,
          t('skipErrorHint'),
          t('errorSessionExpired'),
          t('errorNoPermission'),
          t('errorNotFound'),
        ),
      });
      return false;
    }
  };

  const handleSetView = (mode: ViewMode) => {
    setViewMode(mode);
    setPage(1);
  };

  return (
    <div className="space-y-5 page-enter" dir="rtl">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold" style={{ color: '#2C2A24' }}>
            {t('pageTitle')}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#9C9890' }}>
            {t('pageSubtitle')}
          </p>
        </div>

        <Button
          disabled={!canCreateTemplate}
          onClick={() => setIsCreateDialogOpen(true)}
          className="rounded-xl h-11 px-5 text-[14px] font-semibold hover:bg-[#1B4332] cursor-pointer gap-2"
          style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
        >
          <Plus className="w-4 h-4" />
          {t('addTask')}
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex border-b"
        style={{ borderColor: '#E4E0D8' }}
      >
        <TabButton
          active={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
          icon={ClipboardList}
          label={t('tabs.occurrences')}
          count={occurrences.total}
        />
        <TabButton
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          icon={FileText}
          label={t('tabs.templates')}
          count={templates.total}
        />
      </div>

      {/* ── Tasks Tab Content ── */}
      {activeTab === 'tasks' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:bg-white border border-white/60 bg-white/40 backdrop-blur-md group"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-neutral-200/50 shadow-inner group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: '#F0EDE4' }}
              >
                <ClipboardList
                  className="w-5 h-5"
                  style={{ color: '#5C5852' }}
                />
              </div>
              <div>
                <p
                  className="text-[24px] font-black tracking-tight"
                  style={{ color: '#2C2A24' }}
                >
                  {occurrences.total}
                </p>
                <p className="text-[12px] font-bold uppercase tracking-wider text-neutral-400">
                  {t('totalTasks')}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:bg-white border border-white/60 bg-white/40 backdrop-blur-md group"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-amber-200/50 shadow-inner group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: '#FFF4EF' }}
              >
                <Clock
                  className="w-5 h-5 animate-pulse"
                  style={{ color: '#E76F51' }}
                />
              </div>
              <div>
                <p
                  className="text-[24px] font-black tracking-tight"
                  style={{ color: '#2C2A24' }}
                >
                  {stats.todo}
                </p>
                <p className="text-[12px] font-bold uppercase tracking-wider text-neutral-400">
                  {t('awaitingExecution')}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:bg-white border border-white/60 bg-white/40 backdrop-blur-md group"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-brand-200/50 shadow-inner group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: '#D8F3DC' }}
              >
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: '#2D6A4F' }}
                />
              </div>
              <div>
                <p
                  className="text-[24px] font-black tracking-tight"
                  style={{ color: '#2C2A24' }}
                >
                  {stats.completed}
                </p>
                <p className="text-[12px] font-bold uppercase tracking-wider text-neutral-400">
                  {t('completedTasks')}
                </p>
              </div>
            </div>
          </div>

          {/* View Toggle + Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {groupIdFilter && (
                <div
                  className="rounded-lg px-3 py-1.5 text-[12px]"
                  style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}
                >
                  {t('filterByGroup')}
                </div>
              )}
              <div
                className="flex rounded-lg p-1"
                style={{ backgroundColor: '#F0EDE4' }}
              >
                {(
                  Object.entries(filterLabels) as [FilterStatus, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange(key)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 cursor-pointer ${
                      statusFilter === key
                        ? 'bg-[#2D6A4F] text-white shadow-sm'
                        : 'text-[#5C5852] hover:text-[#2C2A24]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* View toggle */}
            <div
              className="flex rounded-lg p-1"
              style={{ backgroundColor: '#F0EDE4' }}
            >
              <button
                onClick={() => handleSetView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 cursor-pointer ${
                  view === 'list'
                    ? 'bg-[#2D6A4F] text-white shadow-sm'
                    : 'text-[#5C5852] hover:text-[#2C2A24]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                {t('viewModes.list')}
              </button>
              <button
                onClick={() => handleSetView('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 cursor-pointer ${
                  view === 'calendar'
                    ? 'bg-[#2D6A4F] text-white shadow-sm'
                    : 'text-[#5C5852] hover:text-[#2C2A24]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {t('viewModes.calendar')}
              </button>
            </div>
          </div>

          {/* Content */}
          {view === 'list' ? (
            <div className="space-y-5">
              {isLoading && (
                <div
                  className="rounded-xl p-8 flex flex-col items-center justify-center gap-3"
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
                  }}
                >
                  <Loader2
                    className="w-6 h-6 animate-spin"
                    style={{ color: '#2D6A4F' }}
                  />
                  <span className="text-[14px]" style={{ color: '#5C5852' }}>
                    {t('loading')}
                  </span>
                </div>
              )}

              {isError && (
                <div
                  className="rounded-xl p-6"
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="w-5 h-5 mt-0.5"
                      style={{ color: '#E76F51' }}
                    />
                    <div className="space-y-3">
                      <p
                        className="text-[14px]"
                        style={{ color: '#5C5852' }}
                      >
                        {tasksError}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => occurrencesQuery.refetch()}
                      >
                        <RefreshCw className="w-4 h-4 ml-2" />
                        {tc('retry')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && !isError && !hasTasks && (
                <div
                  className="rounded-xl p-10 text-center"
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#F0EDE4' }}
                  >
                    <ClipboardList
                      className="w-7 h-7"
                      style={{ color: '#9C9890' }}
                    />
                  </div>
                  <p
                    className="text-[16px] font-semibold mb-1"
                    style={{ color: '#2C2A24' }}
                  >
                    {t('noTasksCurrently')}
                  </p>
                  <p
                    className="text-[13px] mb-5 max-w-sm mx-auto"
                    style={{ color: '#9C9890' }}
                  >
                    {statusFilter !== 'all'
                      ? t('noTasksFilterHint')
                      : t('noTasksAddHint')}
                  </p>
                  {statusFilter === 'all' && canCreateTemplate && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="rounded-xl h-11 px-6 text-[14px] font-semibold cursor-pointer gap-2"
                      style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
                    >
                      <Plus className="w-4 h-4" />
                      {t('addNewTask')}
                    </Button>
                  )}
                </div>
              )}

              {!isLoading &&
                !isError &&
                sections.map((section) => (
                  <div key={section.date}>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-[12px] font-semibold tracking-wide"
                        style={{ color: '#5C5852' }}
                      >
                        {section.label}
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ backgroundColor: '#E4E0D8' }}
                      />
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: '#F0EDE4',
                          color: '#5C5852',
                        }}
                      >
                        {section.tasks.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {section.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={handleOpenTaskDetail}
                        />
                      ))}
                    </div>
                  </div>
                ))}

              {/* Pagination */}
              {!isLoading && !isError && occurrences.total > PAGE_SIZE && (
                <Pagination
                  page={page}
                  total={occurrences.total}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <CalendarView
                monthDate={monthDate}
                taskCounts={taskCountsByDate}
                selectedDate={effectiveSelectedCalendarDate ?? undefined}
                onSelectDate={setSelectedCalendarDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />

              {effectiveSelectedCalendarDate && (
                <div
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4
                      className="text-[14px] font-semibold"
                      style={{ color: '#2C2A24' }}
                    >
                      {formatSectionLabelIntl(
                        effectiveSelectedCalendarDate,
                        t('todayLabel'),
                        t('tomorrowLabel'),
                      )}
                    </h4>
                    <span
                      className="text-[12px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#F0EDE4', color: '#5C5852' }}
                    >
                      {calendarTasksForSelectedDate.length}
                    </span>
                  </div>

                  {calendarTasksForSelectedDate.length > 0 ? (
                    <div className="space-y-1.5">
                      {calendarTasksForSelectedDate.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={handleOpenTaskDetail}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px]" style={{ color: '#9C9890' }}>
                      {t('noTasksOnDay')}
                    </p>
                  )}
                </div>
              )}

              {calendarOccurrencesQuery.isFetching && (
                <div
                  className="flex items-center gap-2 text-[12px]"
                  style={{ color: '#9C9890' }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t('updatingCalendar')}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Templates Tab Content ── */}
      {activeTab === 'templates' && <TemplatesTab />}

      {/* ── Modals ── */}
      <TaskOccurrenceDetailModal
        key={selectedOccurrenceId ?? 'no-occurrence'}
        open={Boolean(selectedOccurrenceId)}
        onClose={handleCloseTaskDetail}
        task={selectedModalTask}
        isLoading={false}
        isCompleting={completeOccurrence.isPending}
        isSkipping={skipOccurrence.isPending}
        canComplete={canCompleteTask}
        canSkip={canSkipTask}
        onComplete={handleCompleteTask}
        onSkip={handleSkipTask}
      />

      <CreateTaskTemplateDialog
        open={isCreateDialogOpen}
        onOpenChange={(openState) => {
          if (!openState) {
            closeEditDialog();
          } else {
            setIsCreateDialogOpen(true);
          }
        }}
        template={editingTemplate as any}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] w-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D6A4F]" />
        </div>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
