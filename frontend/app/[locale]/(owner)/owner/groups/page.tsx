'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  TrendingDown,
  Users,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateGroupModal } from '@/app/[locale]/(owner)/_components/modals/create-group-modal';
import {
  useCreateGroup,
  useGroups,
  useUpdateGroup,
} from '@/lib/hooks/api/use-groups';
import { usePermission } from '@/lib/hooks/use-permission';

/* ── Filter Tabs ── */
type FilterStatus = 'all' | 'active' | 'sold' | 'closed';
type GroupStatus = Exclude<FilterStatus, 'all'>;

type ApiGroup = {
  id: string;
  group_id?: string;
  groupId?: string;
  name: string;
  type?: string;
  species?: string;
  breed?: string;
  building?: string;
  arrival_date?: string;
  arrivalDate?: string;
  initial_quantity?: number;
  initialQuantity?: number;
  current_quantity?: number;
  currentQuantity?: number;
  status?: string;
  age_days?: number;
  ageDays?: number;
  created_at?: string;
  createdAt?: string;
};

type ListGroupsResponse = {
  groups?: ApiGroup[];
  total?: number;
};

type GroupCardViewModel = {
  id: string;
  name: string;
  entityType: string;
  typeValue: string;
  breedValue: string;
  building: string;
  status: GroupStatus;
  currentQuantity: number;
  initialQuantity: number;
  mortality: number;
  mortalityRate: number;
  ageDays: number;
  startDate: string;
  startDateValue: string;
};

type QuickEditFormState = {
  name: string;
  type: string;
  breed: string;
  status: GroupStatus;
  arrivalDate: string;
};

function normalizeStatus(value?: string): GroupStatus {
  const normalized = value?.toLowerCase();
  if (normalized === 'sold' || normalized === 'closed') return normalized;
  return 'active';
}

/** Format numbers with English (Latin) digits */
function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatArrivalDate(value?: string): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ar-u-nu-latn', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function toDateInputValue(value?: string): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function resolveGroupId(group: ApiGroup): string {
  return group.id || group.group_id || group.groupId || '';
}

/* ── Group Card ── */
function GroupCard({
  group,
  canEdit,
  onEdit,
}: Readonly<{
  group: GroupCardViewModel;
  canEdit: boolean;
  onEdit: (group: GroupCardViewModel) => void;
}>) {
  const t = useTranslations('groups');
  const tc = useTranslations('common');

  const statusStyles = {
    active: { bg: '#D8F3DC', color: '#0D2818', label: t('statusLabels.active'), dot: '#2D6A4F' },
    sold: { bg: '#DBEAFE', color: '#1E40AF', label: t('statusLabels.sold'), dot: '#3B82F6' },
    closed: { bg: '#F3F4F6', color: '#374151', label: t('statusLabels.closed'), dot: '#9CA3AF' },
  };

  const status = statusStyles[group.status];
  const progress =
    group.initialQuantity > 0
      ? Math.min((group.currentQuantity / group.initialQuantity) * 100, 100)
      : 0;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group/card"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F0EDE4',
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h3
            className="font-display text-[17px] font-semibold truncate"
            style={{ color: '#2C2A24' }}
          >
            {group.name}
          </h3>
          <span
            className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: status.dot }}
            />
            {status.label}
          </span>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: '#F0EDE4', color: '#5C5852' }}
        >
          {group.entityType}
        </span>
      </div>

      {/* Stats */}
      <div className="px-5 pb-4 space-y-3">
        {/* Quantities Row */}
        <div className="flex items-end justify-between">
          <div>
            <p
              className="text-[11px] font-medium uppercase tracking-wider mb-1"
              style={{ color: '#9C9890' }}
            >
              {t('currentInitialCount')}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-display text-[28px] leading-none font-bold tabular-nums"
                style={{ color: '#2C2A24' }}
                dir="ltr"
              >
                {formatNumber(group.currentQuantity)}
              </span>
              <span
                className="text-[16px] font-medium tabular-nums"
                style={{ color: '#9C9890' }}
                dir="ltr"
              >
                / {formatNumber(group.initialQuantity)}
              </span>
            </div>
          </div>

          {group.mortality > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: '#FEF2F2' }}
            >
              <TrendingDown className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
              <span
                className="text-[13px] font-semibold tabular-nums"
                style={{ color: '#EF4444' }}
                dir="ltr"
              >
                {formatNumber(group.mortality)}
              </span>
              <span className="text-[11px]" style={{ color: '#EF4444' }}>
                {t('mortality')} ({formatNumber(Math.round(group.mortalityRate))}%)
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: '#F0EDE4' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor:
                  progress > 80 ? '#2D6A4F' : progress > 50 ? '#D4A843' : '#EF4444',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span
              className="text-[10px] tabular-nums"
              style={{ color: '#9C9890' }}
              dir="ltr"
            >
              {formatNumber(Math.round(progress))}%
            </span>
          </div>
        </div>

        {/* Info Grid: breed, age, date, building */}
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t"
          style={{ borderColor: '#F0EDE4' }}
        >
          {group.breedValue && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: '#9C9890' }}>
                {t('breed')}
              </span>
              <span
                className="text-[12px] font-medium truncate"
                style={{ color: '#2C2A24' }}
              >
                {group.breedValue}
              </span>
            </div>
          )}
          {group.ageDays > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: '#9C9890' }}>
                {t('age')}
              </span>
              <span
                className="text-[12px] font-medium tabular-nums"
                style={{ color: '#2C2A24' }}
                dir="ltr"
              >
                {formatNumber(group.ageDays)} {tc('day')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0" style={{ color: '#9C9890' }} />
            <span
              className="text-[12px] truncate"
              style={{ color: '#5C5852' }}
            >
              {group.startDate}
            </span>
          </div>
          {group.building && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: '#9C9890' }}>
                {t('building')}
              </span>
              <span
                className="text-[12px] font-medium truncate"
                style={{ color: '#2C2A24' }}
              >
                {group.building}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid #F0EDE4', backgroundColor: '#FAFAF8' }}
      >
        <Link
          href={`/owner/groups/${group.id}`}
          className="flex items-center gap-1 text-[13px] font-semibold hover:underline transition-colors"
          style={{ color: '#2D6A4F' }}
        >
          {t('viewDetails')}
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(group)}
            className="p-2 rounded-lg transition-colors hover:bg-[#F0EDE4] cursor-pointer opacity-0 group-hover/card:opacity-100"
            title={t('quickEdit')}
            aria-label={t('editLabel', { name: group.name })}
          >
            <Pencil className="w-4 h-4" style={{ color: '#9C9890' }} />
          </button>
        )}
      </div>
    </div>
  );
}

function QuickEditGroupDialog({
  open,
  group,
  form,
  onFormChange,
  onClose,
  onSubmit,
  isSubmitting,
}: Readonly<{
  open: boolean;
  group: GroupCardViewModel | null;
  form: QuickEditFormState;
  onFormChange: (next: Partial<QuickEditFormState>) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}>) {
  const t = useTranslations('groups');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent dir="rtl" className="max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {t('editGroup')}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {t('editGroupDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <p
              className="text-[13px] font-semibold"
              style={{ color: '#2C2A24' }}
            >
              {t('groupName')}
            </p>
            <Input
              value={form.name}
              onChange={(event) => onFormChange({ name: event.target.value })}
              placeholder={t('groupNamePlaceholder')}
              disabled={isSubmitting}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('groupType')}
              </p>
              <Select
                value={form.type}
                onValueChange={(value) => onFormChange({ type: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="broiler">{t('entityTypes.broiler')}</SelectItem>
                  <SelectItem value="layer">{t('entityTypes.layer')}</SelectItem>
                  <SelectItem value="turkey">{t('entityTypes.turkey')}</SelectItem>
                  <SelectItem value="duck">{t('entityTypes.duck')}</SelectItem>
                  <SelectItem value="other">{t('entityTypes.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('breedLabel')}
              </p>
              <Input
                value={form.breed}
                onChange={(event) =>
                  onFormChange({ breed: event.target.value })
                }
                placeholder={t('breedPlaceholder')}
                disabled={isSubmitting}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('statusLabel')}
              </p>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  onFormChange({ status: value as GroupStatus })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={t('selectStatus')} />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="active">{t('statusLabels.active')}</SelectItem>
                  <SelectItem value="sold">{t('statusLabels.sold')}</SelectItem>
                  <SelectItem value="closed">{t('statusLabels.closed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('startDate')}
              </p>
              <Input
                type="date"
                value={form.arrivalDate}
                onChange={(event) =>
                  onFormChange({ arrivalDate: event.target.value })
                }
                disabled={isSubmitting}
                className="rounded-xl"
              />
            </div>
          </div>

          <p className="text-[12px]" style={{ color: '#9C9890' }}>
            {t('quantityNotEditable')}
          </p>

          {group && (
            <p
              className="text-[11px] font-mono tabular-nums"
              style={{ color: '#9C9890' }}
              dir="ltr"
            >
              ID: {group.id}
            </p>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl"
          >
            {tc('cancel')}
          </Button>
          <Button
            onClick={() => {
              void onSubmit();
            }}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl"
            style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
          >
            {isSubmitting ? tc('saving') : tc('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Empty State ── */
function EmptyState({
  canCreateGroup,
  onCreate,
}: Readonly<{
  canCreateGroup: boolean;
  onCreate: () => void;
}>) {
  const t = useTranslations('groups');

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: '#D8F3DC' }}
      >
        <Users className="w-9 h-9" style={{ color: '#2D6A4F' }} />
      </div>
      <h3
        className="font-display text-[22px] font-semibold mb-2"
        style={{ color: '#2C2A24' }}
      >
        {t('emptyTitle')}
      </h3>
      <p
        className="text-[14px] mb-6 text-center max-w-[300px]"
        style={{ color: '#9C9890' }}
      >
        {t('emptyDescription')}
      </p>
      {canCreateGroup && (
        <Button
          onClick={onCreate}
          className="rounded-xl h-11 px-6 text-[14px] font-semibold hover:bg-[#1B4332] cursor-pointer"
          style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
        >
          <Plus className="w-4 h-4 ml-2" />
          {t('createGroup')}
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  const t = useTranslations('groups');

  return (
    <div className="flex items-center justify-center py-16 gap-3">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#2D6A4F' }} />
      <p className="text-[14px]" style={{ color: '#5C5852' }}>
        {t('loading')}
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: Readonly<{
  message: string;
  onRetry: () => void;
}>) {
  const tc = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <p className="text-[15px] font-medium" style={{ color: '#5C5852' }}>
        {message}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="rounded-xl h-10 px-4 cursor-pointer"
      >
        <RefreshCw className="w-4 h-4 ml-2" />
        {tc('retry')}
      </Button>
    </div>
  );
}

/* ── Page ── */
export default function GroupsPage() {
  const t = useTranslations('groups');
  const tc = useTranslations('common');

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupCardViewModel | null>(
    null,
  );
  const [quickEditForm, setQuickEditForm] = useState<QuickEditFormState>({
    name: '',
    type: '',
    breed: '',
    status: 'active',
    arrivalDate: '',
  });

  const canCreateGroup = usePermission('create:group');
  const canUpdateGroup = usePermission('update:group');
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();

  const filterLabels: Record<FilterStatus, string> = {
    all: t('filterLabels.all'),
    active: t('filterLabels.active'),
    sold: t('filterLabels.sold'),
    closed: t('filterLabels.closed'),
  };

  function getEntityTypeLabel(value?: string): string {
    const normalized = value?.toLowerCase();
    switch (normalized) {
      case 'broiler': return t('entityTypes.broiler');
      case 'layer': return t('entityTypes.layer');
      case 'turkey': return t('entityTypes.turkey');
      case 'duck': return t('entityTypes.duck');
      default: return value || t('entityTypes.unknown');
    }
  }

  function getApiErrorMessage(error: unknown): string {
    const fallback = t('loadError');

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
        return t('sessionExpired');
      case 403:
        return t('noPermission');
      default:
        return fallback;
    }
  }

  const groupsQuery = useGroups(
    filter === 'all' ? undefined : { status: filter },
  );

  const groups = useMemo<GroupCardViewModel[]>(() => {
    const payload = groupsQuery.data as
      | ListGroupsResponse
      | ApiGroup[]
      | undefined;
    let list: ApiGroup[] = [];

    if (Array.isArray(payload)) {
      list = payload;
    } else if (Array.isArray(payload?.groups)) {
      list = payload.groups;
    }

    return list
      .map((group) => {
        const resolvedId = resolveGroupId(group);

        if (!resolvedId) {
          return null;
        }

        const initialQuantity = Number(
          group.initial_quantity ?? group.initialQuantity ?? 0,
        );
        const currentQuantity = Number(
          group.current_quantity ?? group.currentQuantity ?? 0,
        );
        const arrivalDate = group.arrival_date ?? group.arrivalDate;
        const mortality = Math.max(initialQuantity - currentQuantity, 0);
        const mortalityRate =
          initialQuantity > 0 ? (mortality / initialQuantity) * 100 : 0;

        // age_days: prefer backend value, fallback to client computation
        const backendAgeDays = Number(group.age_days ?? group.ageDays ?? 0);
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
          id: resolvedId,
          name: group.name,
          entityType: getEntityTypeLabel(group.type || group.species),
          typeValue: group.type || group.species || '',
          breedValue: group.breed || '',
          building: group.building || '',
          status: normalizeStatus(group.status),
          currentQuantity,
          initialQuantity,
          mortality,
          mortalityRate,
          ageDays: backendAgeDays > 0 ? backendAgeDays : computedAgeDays,
          startDate: formatArrivalDate(arrivalDate),
          startDateValue: toDateInputValue(arrivalDate),
        };
      })
      .filter((group): group is GroupCardViewModel => group !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsQuery.data]);

  function openQuickEdit(group: GroupCardViewModel) {
    setEditingGroup(group);
    setQuickEditForm({
      name: group.name,
      type: group.typeValue,
      breed: group.breedValue,
      status: group.status,
      arrivalDate: group.startDateValue,
    });
    setIsQuickEditOpen(true);
  }

  function closeQuickEdit() {
    if (updateGroup.isPending) return;

    setIsQuickEditOpen(false);
    setEditingGroup(null);
  }

  async function handleQuickEditSubmit() {
    if (!editingGroup) return;

    const name = quickEditForm.name.trim();
    const type = quickEditForm.type.trim();
    const breed = quickEditForm.breed.trim();

    if (!name) {
      toast.error(t('nameRequired'));
      return;
    }

    if (!type) {
      toast.error(t('typeRequired'));
      return;
    }

    await updateGroup.mutateAsync({
      id: editingGroup.id,
      data: {
        name,
        type,
        breed,
        status: quickEditForm.status,
        arrival_date: quickEditForm.arrivalDate || undefined,
      },
    });

    await groupsQuery.refetch();
    toast.success(t('updateSuccess'));
    closeQuickEdit();
  }

  async function handleCreateGroup(data: {
    name: string;
    entityType: string;
    breed: string;
    initialQuantity: number;
    startDate: string;
  }) {
    await createGroup.mutateAsync({
      name: data.name,
      type: data.entityType,
      breed: data.breed,
      arrival_date: data.startDate,
      initial_quantity: data.initialQuantity,
    });

    toast.success(t('createSuccess'));
  }

  const errorMessage = groupsQuery.error
    ? getApiErrorMessage(groupsQuery.error)
    : null;

  const isInitialLoading = groupsQuery.isLoading && groups.length === 0;

  let content: React.ReactNode;

  if (isInitialLoading) {
    content = <LoadingState />;
  } else if (errorMessage) {
    content = (
      <ErrorState
        message={errorMessage}
        onRetry={() => groupsQuery.refetch()}
      />
    );
  } else if (groups.length === 0) {
    content = (
      <EmptyState
        canCreateGroup={canCreateGroup}
        onCreate={() => setIsCreateModalOpen(true)}
      />
    );
  } else {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            canEdit={canUpdateGroup}
            onEdit={openQuickEdit}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div
            className="flex rounded-xl p-1 gap-0.5"
            style={{ backgroundColor: '#F0EDE4' }}
          >
            {(Object.entries(filterLabels) as [FilterStatus, string][]).map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                    filter === key
                      ? 'bg-[#2D6A4F] text-white shadow-sm'
                      : 'text-[#5C5852] hover:text-[#2C2A24] hover:bg-white/50'
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center gap-3">
            {groupsQuery.isFetching && !isInitialLoading && (
              <div className="flex items-center gap-1.5">
                <Loader2
                  className="w-3.5 h-3.5 animate-spin"
                  style={{ color: '#9C9890' }}
                />
                <span className="text-[12px]" style={{ color: '#9C9890' }}>
                  {tc('refreshing')}
                </span>
              </div>
            )}

            {canCreateGroup && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-xl h-11 px-5 text-[14px] font-semibold hover:bg-[#1B4332] cursor-pointer"
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
              >
                <Plus className="w-4 h-4 ml-2" />
                {t('newGroup')}
              </Button>
            )}
          </div>
        </div>

        {content}
      </div>

      <CreateGroupModal
        open={isCreateModalOpen}
        onClose={() => {
          if (!createGroup.isPending) {
            setIsCreateModalOpen(false);
          }
        }}
        onSubmit={handleCreateGroup}
        isSubmitting={createGroup.isPending}
      />

      <QuickEditGroupDialog
        open={isQuickEditOpen}
        group={editingGroup}
        form={quickEditForm}
        onFormChange={(next) =>
          setQuickEditForm((previous) => ({ ...previous, ...next }))
        }
        onClose={closeQuickEdit}
        onSubmit={handleQuickEditSubmit}
        isSubmitting={updateGroup.isPending}
      />
    </>
  );
}
