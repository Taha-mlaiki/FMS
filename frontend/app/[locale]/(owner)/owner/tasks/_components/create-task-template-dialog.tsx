'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Repeat, Users, FolderOpen, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
import { Label } from '@/components/ui/label';
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
} from '@/lib/hooks/api/use-tasks';
import {
  useCreateOccurrence,
  useUpdateOccurrence,
} from '@/lib/hooks/api/use-occurrences';
import { useGroups } from '@/lib/hooks/api/use-groups';
import { useWorkers } from '@/lib/hooks/api/use-workers';
import {
  useTaskCategories,
  useCreateTaskCategory,
} from '@/lib/hooks/api/use-task-categories';
import { useTaskStore } from '@/lib/stores/task.store';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

type TaskData = {
  id: string;
  title?: string;
  description?: string;
  category_id?: string;
  categoryId?: string;
  priority?: string;
  recurrence?: string;
  time_of_day?: string;
  timeOfDay?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  days_of_week?: number[];
  daysOfWeek?: number[];
  day_of_month?: number;
  dayOfMonth?: number;
  month_of_year?: number;
  monthOfYear?: number;
  worker_ids?: string[];
  workerIds?: string[];
  group_ids?: string[];
  groupIds?: string[];
};

export type CreateTaskTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TaskData | null;
};

type MemberItem = {
  user_id?: string;
  userId?: string;
  id?: string;
  email?: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role?: string;
  is_active?: boolean;
  isActive?: boolean;
  status?: string;
};

type GroupItem = {
  id?: string;
  name?: string;
  status?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIsoDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeMembers(payload: unknown): MemberItem[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.members)) return source.members as MemberItem[];
  if (typeof source.data === 'object' && source.data !== null) {
    const data = source.data as Record<string, unknown>;
    if (Array.isArray(data.members)) return data.members as MemberItem[];
  }
  return [];
}

function normalizeGroups(payload: unknown): GroupItem[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.groups)) return source.groups as GroupItem[];
  if (Array.isArray(source.data)) return source.data as GroupItem[];
  return [];
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;
  const maybeAxios = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const msg = maybeAxios.response?.data?.message;
  if (Array.isArray(msg) && msg.length > 0) return msg[0] ?? fallback;
  if (typeof msg === 'string' && msg.trim()) return msg;
  return fallback;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateTaskTemplateDialog({
  open,
  onOpenChange,
  template,
}: Readonly<CreateTaskTemplateDialogProps>) {
  const t = useTranslations('tasks.templates');
  const tc = useTranslations('common');

  const WEEK_DAYS = [
    { value: 0, label: t('weekDays.sun') },
    { value: 1, label: t('weekDays.mon') },
    { value: 2, label: t('weekDays.tue') },
    { value: 3, label: t('weekDays.wed') },
    { value: 4, label: t('weekDays.thu') },
    { value: 5, label: t('weekDays.fri') },
    { value: 6, label: t('weekDays.sat') },
  ];

  const MONTHS = [
    { value: 1, label: t('months.jan') },
    { value: 2, label: t('months.feb') },
    { value: 3, label: t('months.mar') },
    { value: 4, label: t('months.apr') },
    { value: 5, label: t('months.may') },
    { value: 6, label: t('months.jun') },
    { value: 7, label: t('months.jul') },
    { value: 8, label: t('months.aug') },
    { value: 9, label: t('months.sep') },
    { value: 10, label: t('months.oct') },
    { value: 11, label: t('months.nov') },
    { value: 12, label: t('months.dec') },
  ];

  const PRIORITIES = [
    { value: 'low', label: t('priorityLow'), color: '#9C9890' },
    { value: 'medium', label: t('priorityMedium'), color: '#F4A261' },
    { value: 'high', label: t('priorityHigh'), color: '#E76F51' },
    { value: 'critical', label: t('priorityCritical'), color: '#DC2626' },
  ];

  const isEditMode = Boolean(template?.id);
  const createTemplate = useCreateTaskTemplate();
  const updateTemplate = useUpdateTaskTemplate();
  const createOccurrence = useCreateOccurrence();
  const updateOccurrence = useUpdateOccurrence();
  const workersQuery = useWorkers({ page: 1, limit: 100 });
  const groupsQuery = useGroups({ page: 1, limit: 200, status: 'active' });
  const categoriesQuery = useTaskCategories();
  const createCategory = useCreateTaskCategory();

  // ── Form state ──────────────────────────────────────────────────────────────

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [startDate, setStartDate] = useState(() => toIsoDate(new Date()));
  const [endDate, setEndDate] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [monthOfYear, setMonthOfYear] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0]);
  const [workerIds, setWorkerIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);

  // New category inline form
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // ── Actions ─────────────────────────────────────────────────────────────────

  function resetForm() {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setPriority('medium');
    setTimeOfDay('08:00');
    setStartDate(toIsoDate(new Date()));
    setEndDate('');
    setRecurrenceType('daily');
    setDayOfMonth(1);
    setMonthOfYear(1);
    setDaysOfWeek([0]);
    setWorkerIds([]);
    setGroupIds([]);
    setShowNewCategory(false);
    setNewCategoryName('');
  }

  // ── Populate form when editing ──────────────────────────────────────────────

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    if (template?.id) {
      setTitle(template.title ?? '');
      setDescription(template.description ?? '');
      setCategoryId(template.category_id ?? template.categoryId ?? '');
      setPriority(template.priority ?? 'medium');
      setTimeOfDay(template.time_of_day ?? template.timeOfDay ?? '08:00');
      setStartDate(
        template.start_date ?? template.startDate ?? toIsoDate(new Date()),
      );
      setEndDate(template.end_date ?? template.endDate ?? '');
      setRecurrenceType((template.recurrence as RecurrenceType) ?? 'daily');
      setDaysOfWeek(template.days_of_week ?? template.daysOfWeek ?? [0]);
      setDayOfMonth(template.day_of_month ?? template.dayOfMonth ?? 1);
      setMonthOfYear(template.month_of_year ?? template.monthOfYear ?? 1);
      setWorkerIds(template.worker_ids ?? template.workerIds ?? []);
      setGroupIds(template.group_ids ?? template.groupIds ?? []);
    } else {
      resetForm();
    }
  }, [open, template]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Normalize data from hooks ───────────────────────────────────────────────

  const categories = useMemo(() => {
    const data = categoriesQuery.data;
    if (!data) return [];
    return (data.categories ?? []) as Array<{
      id: string;
      name: string;
      color: string;
    }>;
  }, [categoriesQuery.data]);

  const workerOptions: MultiSelectOption[] = useMemo(() => {
    const normalized = normalizeMembers(workersQuery.data);
    console.log('[WorkerOptions] Raw data:', workersQuery.data);
    console.log('[WorkerOptions] After normalize:', normalized);

    const filtered = normalized.filter((m) => {
      const role = String(m.role ?? '').toUpperCase();
      const normalizedStatus = String(m.status ?? '').toLowerCase();
      const isInactive =
        normalizedStatus === 'inactive' ||
        m.is_active === false ||
        m.isActive === false;
      const isPending = normalizedStatus === 'pending';
      const isActive = !isInactive && !isPending;

      const passesRoleCheck = role === 'WORKER';
      const passesActiveCheck = isActive;

      console.log('[WorkerOptions] Filter debug:', {
        name: m.firstName || m.first_name,
        role,
        status: m.status,
        isInactive,
        isPending,
        isActive,
        passesRoleCheck,
        passesActiveCheck,
        wouldInclude: passesRoleCheck && passesActiveCheck,
      });

      return passesRoleCheck && passesActiveCheck;
    });

    console.log('[WorkerOptions] After filter:', filtered);

    const mapped = filtered.map((m) => {
      const id = m.userId ?? m.user_id ?? m.id ?? '';
      const label =
        ((m.fullName ??
          m.full_name ??
          m.name ??
          [m.firstName, m.lastName].filter(Boolean).join(' ')) ||
          [m.first_name, m.last_name].filter(Boolean).join(' ') ||
          m.email) ??
        id;
      return { value: id, label };
    });

    const final = mapped.filter((o) => o.value.length > 0);
    console.log('[WorkerOptions] Final options:', final);

    return final;
  }, [workersQuery.data]);

  const groupOptions: MultiSelectOption[] = useMemo(() => {
    return normalizeGroups(groupsQuery.data)
      .map((g) => ({
        value: g.id ?? '',
        label: g.name ?? g.id ?? 'Group',
      }))
      .filter((o) => o.value.length > 0);
  }, [groupsQuery.data]);

  function toggleWeekDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const result = await createCategory.mutateAsync({
        name: newCategoryName.trim(),
      });
      setCategoryId(result.id);
      setShowNewCategory(false);
      setNewCategoryName('');
      toast.success(t('categoryAddSuccess'));
    } catch {
      toast.error(t('categoryAddError'));
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error(t('taskNameRequired'));
      return;
    }
    if (!startDate) {
      toast.error(t('startDateRequired'));
      return;
    }
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      toast.error(t('selectOneDayMin'));
      return;
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId || undefined,
      priority,
      recurrence: recurrenceType,
      startDate: startDate,
      endDate: recurrenceType !== 'once' && endDate ? endDate : undefined,
      timeOfDay: timeOfDay,
      workerIds: workerIds,
      groupIds: groupIds,
      materials: [],
    };

    if (recurrenceType === 'weekly') {
      payload.daysOfWeek = daysOfWeek;
    }
    if (recurrenceType === 'monthly' || recurrenceType === 'yearly') {
      payload.dayOfMonth = dayOfMonth > 0 ? dayOfMonth : 1;
    }
    if (recurrenceType === 'yearly') {
      payload.monthOfYear = monthOfYear;
    }

    try {
      if (isEditMode && template?.id) {
        if (recurrenceType === 'once') {
          await updateOccurrence.mutateAsync({
            id: template.id,
            data: payload,
          });
        } else {
          await updateTemplate.mutateAsync({ id: template.id, data: payload });
        }
        toast.success(t('updateSuccess'));
      } else {
        if (recurrenceType === 'once') {
          await createOccurrence.mutateAsync(payload);
        } else {
          await createTemplate.mutateAsync(payload);
        }
        toast.success(t('createSuccess'));

        // Switch to the correct tab so user sees the new task
        if (recurrenceType === 'once') {
          useTaskStore.getState().setActiveTab('tasks');
        } else {
          useTaskStore.getState().setActiveTab('templates');
        }
      }
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode ? t('updateError') : t('createError'),
        ),
      );
    }
  }

  const isPending =
    createTemplate.isPending ||
    updateTemplate.isPending ||
    createOccurrence.isPending ||
    updateOccurrence.isPending;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90dvh] max-w-xl overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-[20px]">
            {isEditMode ? t('editTitle') : t('createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t('editDescription') : t('createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pe-1">
          {/* ── Section 1: Basic Info ─────────────────────────── */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-title" className="text-[13px] font-semibold">
                {t('taskName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tpl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('taskNamePlaceholder')}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-desc" className="text-[13px] font-semibold">
                {t('taskDescription')}{' '}
                <span className="text-muted-foreground font-normal">
                  ({t('taskDescriptionOptional')})
                </span>
              </Label>
              <Textarea
                id="tpl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('taskDescriptionPlaceholder')}
                className="min-h-16 resize-none"
              />
            </div>

            {/* Category & Priority in one row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">
                  <FolderOpen className="w-3.5 h-3.5 inline-block ml-1" />
                  {t('category')}
                </Label>
                {!showNewCategory ? (
                  <div className="flex gap-2">
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder={t('categoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={() => setShowNewCategory(true)}
                      title={t('addNewCategory')}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={t('categoryNamePlaceholder')}
                      className="h-11 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleAddCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      style={{ backgroundColor: '#2D6A4F' }}
                      onClick={() => void handleAddCategory()}
                      disabled={createCategory.isPending}
                    >
                      {createCategory.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={() => setShowNewCategory(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">
                  {t('priorityLabel')}
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Section 2: Schedule ─────────────────────────── */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ backgroundColor: '#F9F8F5', border: '1px solid #E4E0D8' }}
          >
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4" style={{ color: '#2D6A4F' }} />
              <h4
                className="text-[14px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('scheduleTitle')}
              </h4>
            </div>

            {/* Recurrence type as visual buttons */}
            <div className="space-y-2">
              <Label className="text-[13px]">{t('recurrenceLabel')}</Label>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { value: 'once', label: t('recurrenceOnce') },
                    { value: 'daily', label: t('recurrenceDaily') },
                    { value: 'weekly', label: t('recurrenceWeekly') },
                    { value: 'monthly', label: t('recurrenceMonthly') },
                    { value: 'yearly', label: t('recurrenceYearly') },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurrenceType(opt.value)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                      recurrenceType === opt.value
                        ? 'text-white shadow-sm'
                        : 'hover:bg-white'
                    }`}
                    style={{
                      backgroundColor:
                        recurrenceType === opt.value ? '#2D6A4F' : '#FFFFFF',
                      color:
                        recurrenceType === opt.value ? '#FFFFFF' : '#5C5852',
                      border: `1px solid ${recurrenceType === opt.value ? '#2D6A4F' : '#E4E0D8'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly day selector */}
            {recurrenceType === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-[13px]">{t('repeatDays')}</Label>
                <div className="flex gap-1.5">
                  {WEEK_DAYS.map((day) => {
                    const isActive = daysOfWeek.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekDay(day.value)}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                          isActive ? 'text-white' : ''
                        }`}
                        style={{
                          backgroundColor: isActive ? '#2D6A4F' : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : '#5C5852',
                          border: `1px solid ${isActive ? '#2D6A4F' : '#E4E0D8'}`,
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly day selector */}
            {recurrenceType === 'monthly' && (
              <div className="space-y-2">
                <Label className="text-[13px]">{t('monthDay')}</Label>
                <Select
                  value={String(dayOfMonth)}
                  onValueChange={(v) => setDayOfMonth(Number(v))}
                >
                  <SelectTrigger className="w-32 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {t('dayPrefix')} {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Yearly: month + day selectors */}
            {recurrenceType === 'yearly' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[13px]">{t('monthLabel')}</Label>
                  <Select
                    value={String(monthOfYear)}
                    onValueChange={(v) => setMonthOfYear(Number(v))}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">{t('dayLabel')}</Label>
                  <Select
                    value={String(dayOfMonth)}
                    onValueChange={(v) => setDayOfMonth(Number(v))}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {t('dayPrefix')} {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Time & Dates */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tpl-time" className="text-[13px]">
                  {t('timeLabel')}
                </Label>
                <Input
                  id="tpl-time"
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="h-11"
                />
              </div>
              <div
                className={`space-y-2 ${recurrenceType === 'once' ? 'col-span-2' : ''}`}
              >
                <Label htmlFor="tpl-start" className="text-[13px]">
                  {recurrenceType === 'once' ? t('dateLabel') : t('startFrom')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tpl-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11"
                />
              </div>
              {recurrenceType !== 'once' && (
                <div className="space-y-2">
                  <Label htmlFor="tpl-end" className="text-[13px]">
                    {t('endAt')}{' '}
                    <span className="text-muted-foreground font-normal text-[11px]">
                      ({t('endAtOptional')})
                    </span>
                  </Label>
                  <Input
                    id="tpl-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="h-11"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Assignment ─────────────────────────── */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ backgroundColor: '#F9F8F5', border: '1px solid #E4E0D8' }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#2D6A4F' }} />
              <h4
                className="text-[14px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('assignTitle')}{' '}
                <span
                  className="text-[12px] font-normal"
                  style={{ color: '#9C9890' }}
                >
                  ({t('assignOptional')})
                </span>
              </h4>
            </div>

            {/* Workers */}
            <div className="space-y-2">
              <Label className="text-[13px]">{t('workersLabel')}</Label>
              {workersQuery.isLoading ? (
                <div
                  className="flex items-center gap-2 py-3 px-4 rounded-lg text-[13px]"
                  style={{ backgroundColor: '#FFFFFF', color: '#9C9890' }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t('loadingWorkers')}
                </div>
              ) : workerOptions.length === 0 ? (
                <p
                  className="text-[13px] py-3 px-4 rounded-lg"
                  style={{ backgroundColor: '#FFFFFF', color: '#9C9890' }}
                >
                  {t('noActiveWorkers')}
                </p>
              ) : (
                <MultiSelect
                  options={workerOptions}
                  selected={workerIds}
                  onChange={setWorkerIds}
                  placeholder={t('workersPlaceholder')}
                  searchPlaceholder={t('workersSearchPlaceholder')}
                  emptyMessage={t('workersEmptyMessage')}
                />
              )}
            </div>

            {/* Groups */}
            <div className="space-y-2">
              <Label className="text-[13px]">{t('groupsLabel')}</Label>
              {groupsQuery.isLoading ? (
                <div
                  className="flex items-center gap-2 py-3 px-4 rounded-lg text-[13px]"
                  style={{ backgroundColor: '#FFFFFF', color: '#9C9890' }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t('loadingGroups')}
                </div>
              ) : groupOptions.length === 0 ? (
                <p
                  className="text-[13px] py-3 px-4 rounded-lg"
                  style={{ backgroundColor: '#FFFFFF', color: '#9C9890' }}
                >
                  {t('noActiveGroups')}
                </p>
              ) : (
                <MultiSelect
                  options={groupOptions}
                  selected={groupIds}
                  onChange={setGroupIds}
                  placeholder={t('groupsPlaceholder')}
                  searchPlaceholder={t('groupsSearchPlaceholder')}
                  emptyMessage={t('groupsEmptyMessage')}
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-11"
          >
            {t('cancelBtn')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isPending}
            className="h-11 px-6"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {isPending && <Loader2 className="size-4 animate-spin ml-2" />}
            {isEditMode ? t('saveEdits') : t('addTaskBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
