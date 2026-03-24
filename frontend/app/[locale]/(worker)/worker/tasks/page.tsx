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
  ChevronUp,
  ChevronDown,
  Layers,
  Users,
  Loader2,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Circle,
  SkipForward,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TaskOccurrenceDetailModal } from '@/components/worker/task-detail-modal';
import {
  useCompleteOccurrence,
  useWorkerTasks,
  useSkipOccurrence,
} from '@/lib/hooks/api/use-occurrences';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { usePermission } from '@/lib/hooks/use-permission';
import { usePreferencesStore } from '@/lib/stores/preferences.store';

/* ── Types ── */
type ViewMode = 'list' | 'calendar';
type TaskStatus = 'todo' | 'doing' | 'completed' | 'skipped';
type FilterStatus = 'all' | TaskStatus;

type ApiOccurrence = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  category_name?: string;
  category_color?: string;
  time_of_day?: string;
  scheduled_date?: string;
  notes?: string;
  completed_at?: string;
  completed_by?: string;
  report_id?: string;
  group_ids?: string[];
  worker_ids?: string[];
  workers?: Array<string | { id?: string; name?: string }>;
  materials?: Array<{
    material_id?: string;
    materialId?: string;
    material_name?: string;
    materialName?: string;
    quantity?: number;
    unit?: string;
  }>;
  group_names?: string[];
  groups?: Array<string | { id?: string; name?: string }>;
};

type TaskTemplate = { id: string };
type GroupOption = { id: string; name: string };

type TaskViewModel = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  time: string;
  date: string;
  priority: string;
  categoryName?: string;
  categoryColor?: string;
  groups: string[];
  workers: ModalWorker[];
};

type MaterialItem = {
  material_id?: string;
  materialId?: string;
  material_name?: string;
  materialName?: string;
  quantity: number;
  unit: string;
};
type ModalWorker = { name: string; initial: string };

type TaskModalModel = {
  id: string;
  title: string;
  status: TaskStatus;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  groups: { id: string; name: string }[];
  workers: ModalWorker[];
  materials?: MaterialItem[];
  report_id?: string;
  completedBy?: string;
  completedAt?: string;
  skipNote?: string;
};

/* ── Helpers ── */

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;
  const maybeError = error as {
    response?: { data?: { message?: string | string[] }; status?: number };
  };
  const message = maybeError.response?.data?.message;
  if (Array.isArray(message) && message.length > 0)
    return message[0] ?? fallback;
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

function getTaskStatus(value?: string): TaskStatus {
  const normalized = value?.toLowerCase();
  if (normalized === 'done' || normalized === 'completed') return 'completed';
  if (normalized === 'skipped') return 'skipped';
  if (normalized === 'doing') return 'doing';
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

function formatSectionLabel(
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
  if (target.getTime() === today.getTime())
    return `${todayLabel} - ${weekdayAndDate}`;
  if (target.getTime() === tomorrow.getTime())
    return `${tomorrowLabel} - ${weekdayAndDate}`;
  return weekdayAndDate;
}

function extractGroupNames(value: ApiOccurrence): string[] {
  if (Array.isArray(value.group_names))
    return value.group_names.filter((name): name is string => Boolean(name));
  if (!Array.isArray(value.groups)) return [];
  return value.groups
    .map((group) => (typeof group === 'string' ? group : (group?.name ?? '')))
    .filter((name): name is string => Boolean(name));
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
  if (Array.isArray(value.workers)) {
    return value.workers
      .map((worker) =>
        typeof worker === 'string'
          ? worker
          : (worker?.name ?? worker?.id ?? ''),
      )
      .filter((name): name is string => Boolean(name));
  }
  if (Array.isArray(value.worker_ids))
    return value.worker_ids.filter((id): id is string => Boolean(id));
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
  if (typeof source.occurrence === 'object' && source.occurrence !== null)
    return source.occurrence as ApiOccurrence;
  if (typeof source.data === 'object' && source.data !== null)
    return source.data as ApiOccurrence;
  return source as ApiOccurrence;
}

function mapOccurrenceToModalTask(
  occurrence: ApiOccurrence,
  fallback?: TaskViewModel,
  untitledTask?: string,
): TaskModalModel {
  const workerNames = extractWorkerNames(occurrence);
  const workers = workerNames.map((name) => ({
    name,
    initial: buildInitial(name),
  }));
  return {
    id: occurrence.id,
    title: occurrence.title || fallback?.title || untitledTask || '',
    status: getTaskStatus(occurrence.status),
    scheduledDate: toDisplayDate(occurrence.scheduled_date || fallback?.date),
    scheduledTime: formatTime(occurrence.time_of_day || fallback?.time),
    description: occurrence.description || fallback?.description,
    groups: extractGroupNames(occurrence).map((name, index) => ({
      id: `group-${index}`,
      name,
    })),
    workers,
    materials: extractMaterials(occurrence),
    report_id: occurrence.report_id,
    completedBy: occurrence.completed_by,
    completedAt: toDisplayDateTime(occurrence.completed_at),
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
    groups: task.groups.map((name, index) => ({ id: `group-${index}`, name })),
    workers: [],
  };
}

function normalizeOccurrences(payload: unknown): {
  list: ApiOccurrence[];
  total: number;
} {
  if (Array.isArray(payload))
    return { list: payload as ApiOccurrence[], total: payload.length };
  if (typeof payload !== 'object' || payload === null)
    return { list: [], total: 0 };
  const source = payload as Record<string, unknown>;
  let listSource: unknown[] = [];
  if (Array.isArray(source.occurrences)) listSource = source.occurrences;
  else if (Array.isArray(source.tasks)) listSource = source.tasks;
  else if (Array.isArray(source.data)) listSource = source.data;
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
  if (Array.isArray(payload))
    return { list: payload as TaskTemplate[], total: payload.length };
  if (typeof payload !== 'object' || payload === null)
    return { list: [], total: 0 };
  const source = payload as Record<string, unknown>;
  let listSource: unknown[] = [];
  if (Array.isArray(source.templates)) listSource = source.templates;
  else if (Array.isArray(source.data)) listSource = source.data;
  const list = listSource as TaskTemplate[];
  const total =
    typeof source.total === 'number' && Number.isFinite(source.total)
      ? source.total
      : list.length;
  return { list, total };
}

const PAGE_SIZE = 20;

const priorityColors: Record<string, string> = {
  high: '#E76F51',
  medium: '#F4A261',
  low: '#2A9D8F',
};

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
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <span
                      key={g}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl border shadow-sm transition-all hover:scale-105"
                      style={{ backgroundColor: '#D8F3DC', color: '#1B4332', borderColor: '#B7E4C7' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] italic text-neutral-400">{t('noGroups') || 'لا توجد مجموعات'}</p>
              )}
            </div>

            {/* Workers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[13px] font-bold text-neutral-700">
                  {t('workersLabel')}
                </p>
                <span className="text-[11px] bg-amber-100/50 text-amber-700 px-2 py-0.5 rounded-full font-black border border-amber-200">
                  {workers.length}
                </span>
              </div>

               {workers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {workers.map((w) => (
                    <div
                      key={w.name}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm bg-white hover:bg-neutral-50 transition-all"
                      style={{ borderColor: '#E4E0D8' }}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: '#F4A261' }}>
                        {w.initial}
                      </div>
                      <span className="text-[11px] font-bold text-neutral-600">{w.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] italic text-neutral-400">{t('noWorkers') || 'لا يوجد عمال'}</p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
             <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(task);
              }}
              className="group/btn relative overflow-hidden rounded-xl bg-brand-900 px-6 py-2.5 text-[13px] font-bold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover/btn:translate-y-0" />
              <span className="relative flex items-center gap-2">
                {t('openDetails')}
                <ChevronLeft className="w-4 h-4" />
              </span>
            </button>
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
  previousLabel,
  nextLabel,
}: Readonly<{
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
}>) {
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
        {previousLabel}
      </button>
      <span className="text-[13px]" style={{ color: '#5C5852' }}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0EDE4]"
        style={{ color: '#5C5852' }}
      >
        {nextLabel}
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
  weekdays,
}: Readonly<{
  monthDate: Date;
  taskCounts: Record<string, number>;
  selectedDate?: string;
  onSelectDate?: (isoDate: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  weekdays: string[];
}>) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

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
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center text-[12px] uppercase font-medium py-2"
            style={{ color: '#9C9890' }}
          >
            {day}
          </div>
        ))}
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
          if (isToday) cellBackground = '#F0FAF3';
          else if (hasTasks && isCurrentMonth) cellBackground = '#FAFAF7';

          return (
            <button
              key={i}
              type="button"
              className={`min-h-17.5 rounded-md p-2 transition-colors text-right ${isCurrentMonth ? 'cursor-pointer hover:bg-[#F0EDE4]' : 'cursor-default'}`}
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
                    className={`text-[13px] font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday || isSelected ? 'text-white' : ''}`}
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

/* ── Page ── */
function TasksPageContent() {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const view = usePreferencesStore((state) => state.taskViewMode) as ViewMode;
  const setTaskViewMode = usePreferencesStore((state) => state.setTaskViewMode);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<
    string | null
  >(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const { user, userId } = useFarmContext();
  const canCompleteTask = usePermission('complete:task');
  const canSkipTask = usePermission('skip:task');



  const filterLabels: Record<FilterStatus, string> = useMemo(
    () => ({
      all: t('filterLabels.all'),
      todo: t('filterLabels.todo'),
      doing: t('filterLabels.doing', { defaultMessage: 'قيد التنفيذ' }),
      completed: t('filterLabels.completed'),
      skipped: t('filterLabels.skipped'),
    }),
    [t],
  );

  const weekdays = useMemo(
    () => [
      t('calendarWeekdays.sun'),
      t('calendarWeekdays.mon'),
      t('calendarWeekdays.tue'),
      t('calendarWeekdays.wed'),
      t('calendarWeekdays.thu'),
      t('calendarWeekdays.fri'),
      t('calendarWeekdays.sat'),
    ],
    [t],
  );

  const todayLabel = t('dateNavigation.today');
  const tomorrowLabel = t('dateNavigation.tomorrow');

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
  // Calendar uses full-month query
  const calendarOccurrencesQuery = useWorkerTasks({
    page: 1,
    limit: 500,
    status: statusFilter === 'all' ? undefined : statusFilter,
    start_date: monthStart,
    end_date: monthEnd,
  });

  // List uses paginated query
  const listOccurrencesQuery = useWorkerTasks({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === 'all' ? undefined : statusFilter,
    start_date: monthStart,
    end_date: monthEnd,
  });

  const occurrencesQuery =
    view === 'calendar' ? calendarOccurrencesQuery : listOccurrencesQuery;


  const completeOccurrence = useCompleteOccurrence();
  const skipOccurrence = useSkipOccurrence();

  const occurrences = useMemo(
    () => normalizeOccurrences(occurrencesQuery.data),
    [occurrencesQuery.data],
  );

  const untitledTask = tCommon('untitledTask');

  const tasks = useMemo<TaskViewModel[]>(
    () =>
      occurrences.list.map((item) => ({
        id: item.id,
        title: item.title || untitledTask,
        description: item.description || '',
        status: getTaskStatus(item.status),
        time: formatTime(item.time_of_day),
        date: item.scheduled_date ? formatDate(item.scheduled_date) : '',
        priority: item.priority || 'medium',
        categoryName: item.category_name,
        categoryColor: item.category_color,
        groups: extractGroupNames(item),
        workers: extractWorkerNames(item).map((name) => ({
          name,
          initial: buildInitial(name),
        })),
      })),
    [occurrences.list, untitledTask],
  );

  const stats = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { all: tasks.length, todo, completed };
  }, [tasks]);

  const selectedListTask = useMemo(
    () => tasks.find((task) => task.id === selectedOccurrenceId),
    [selectedOccurrenceId, tasks],
  );

  const selectedOccurrenceData = useMemo(
    () => occurrences.list.find((o) => o.id === selectedOccurrenceId),
    [selectedOccurrenceId, occurrences.list],
  );

  const selectedOccurrenceDetail = useMemo(
    () => normalizeOccurrenceDetail(selectedOccurrenceData),
    [selectedOccurrenceData],
  );

  const selectedModalTask = useMemo(() => {
    if (selectedOccurrenceDetail)
      return mapOccurrenceToModalTask(
        selectedOccurrenceDetail,
        selectedListTask,
        untitledTask,
      );
    if (selectedListTask) return mapViewTaskToModalTask(selectedListTask);
    return undefined;
  }, [selectedListTask, selectedOccurrenceDetail, untitledTask]);

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
        label:
          date === 'undated'
            ? t('dateNavigation.undated')
            : formatSectionLabel(date, todayLabel, tomorrowLabel),
        tasks: dateTasks,
      }));
  }, [tasks, t, todayLabel, tomorrowLabel]);

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

  const tasksError = getApiErrorMessage(occurrencesQuery.error, t('loading'));

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
    setPage(1);
  };

  const handleOpenTaskDetail = (task: TaskViewModel) => {
    setSelectedOccurrenceId(task.id);
  };

  const handleCloseTaskDetail = () => {
    setSelectedOccurrenceId(null);
  };

  const handleSelectCalendarDate = (isoDate: string) => {
    setSelectedCalendarDate(isoDate);
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
      toast.success(t('completeSuccess'));
      return true;
    } catch (error) {
      toast.error(t('completeError'), {
        description: getApiErrorMessage(error, tCommon('retry')),
      });
      return false;
    }
  };

  const handleSkipTask = async (payload: { reason?: string }) => {
    if (!selectedOccurrenceId) return false;
    try {
      await skipOccurrence.mutateAsync({
        id: selectedOccurrenceId,
        data: { reason: payload.reason, skipped_by: actorName },
      });
      toast.success(t('skipSuccess'));
      return true;
    } catch (error) {
      toast.error(t('skipError'), {
        description: getApiErrorMessage(error, tCommon('retry')),
      });
      return false;
    }
  };

  return (
    <div className="space-y-5 page-enter" dir="rtl">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold" style={{ color: '#2C2A24' }}>
            {t('myTasks')}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#9C9890' }}>
            {t('myTasksSubtitle')}
          </p>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#F0EDE4' }}
          >
            <ClipboardList
              className="w-4.5 h-4.5"
              style={{ color: '#5C5852' }}
            />
          </div>
          <div>
            <p className="text-[20px] font-bold" style={{ color: '#2C2A24' }}>
              {occurrences.total}
            </p>
            <p className="text-[11px]" style={{ color: '#9C9890' }}>
              {t('totalTasks')}
            </p>
          </div>
        </div>
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#FFF4EF' }}
          >
            <Circle className="w-4.5 h-4.5" style={{ color: '#F4A261' }} />
          </div>
          <div>
            <p className="text-[20px] font-bold" style={{ color: '#2C2A24' }}>
              {stats.todo}
            </p>
            <p className="text-[11px]" style={{ color: '#9C9890' }}>
              {t('awaitingExecution')}
            </p>
          </div>
        </div>
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#D8F3DC' }}
          >
            <CheckCircle2
              className="w-4.5 h-4.5"
              style={{ color: '#2D6A4F' }}
            />
          </div>
          <div>
            <p className="text-[20px] font-bold" style={{ color: '#2C2A24' }}>
              {stats.completed}
            </p>
            <p className="text-[11px]" style={{ color: '#9C9890' }}>
              {t('statusConfig.completed')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex rounded-lg p-1"
            style={{ backgroundColor: '#F0EDE4' }}
          >
            {(Object.entries(filterLabels) as [FilterStatus, string][]).map(
              ([key, label]) => (
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
              ),
            )}
          </div>
        </div>

        <div
          className="flex rounded-lg p-1"
          style={{ backgroundColor: '#F0EDE4' }}
        >
          <button
            onClick={() => {
              setTaskViewMode('list');
              setPage(1);
            }}
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
            onClick={() => setTaskViewMode('calendar')}
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

      {/* ── Content ── */}
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
                  <p className="text-[14px]" style={{ color: '#5C5852' }}>
                    {tasksError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => occurrencesQuery.refetch()}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    {tCommon('retry')}
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
                {t('noTasks')}
              </p>
              <p className="text-[13px]" style={{ color: '#9C9890' }}>
                {statusFilter !== 'all'
                  ? t('noTasksFilterDescription')
                  : t('noTasksDescription')}
              </p>
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
                    style={{ backgroundColor: '#F0EDE4', color: '#5C5852' }}
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

          {!isLoading && !isError && occurrences.total > PAGE_SIZE && (
            <Pagination
              page={page}
              total={occurrences.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              previousLabel={t('pagination.previous')}
              nextLabel={t('pagination.next')}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <CalendarView
            monthDate={monthDate}
            taskCounts={taskCountsByDate}
            selectedDate={effectiveSelectedCalendarDate ?? undefined}
            onSelectDate={handleSelectCalendarDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            weekdays={weekdays}
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
                  {formatSectionLabel(
                    effectiveSelectedCalendarDate,
                    todayLabel,
                    tomorrowLabel,
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
                  {t('noTasksForDay')}
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
