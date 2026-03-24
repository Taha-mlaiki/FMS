'use client';

import { useMemo, useState, Suspense, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Pencil, Plus, RefreshCw } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateReport,
  useReports,
  useUpdateReport,
} from '@/lib/hooks/api/use-reports';
import { toast } from 'sonner';

/* ── Types ── */
type ReportType = 'incident' | 'progress' | 'maintenance';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'resolved'
  | 'open'
  | 'in_review';

type ApiReport = {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  status?: string;
  group_id?: string;
  group_name?: string;
  created_by?: string;
  created_at?: string;
};

type ReportsResponse = {
  reports?: ApiReport[];
  total?: number;
};

type ReportFormState = {
  title: string;
  description: string;
  type: 'incident' | 'progress' | 'maintenance';
  severity: Severity;
};

const typeIconConfig: Record<ReportType, { icon: string }> = {
  incident: { icon: '⚠' },
  progress: { icon: '📈' },
  maintenance: { icon: '🛠' },
};

const severityStyleConfig: Record<
  Severity,
  { bg: string; color: string; pulse?: boolean }
> = {
  critical: { bg: '#E76F51', color: '#FFFFFF', pulse: true },
  high: { bg: '#E9762B', color: '#FFFFFF' },
  medium: { bg: '#F4A261', color: '#2C2A24' },
  low: { bg: '#457B9D', color: '#FFFFFF' },
};

const statusStyleConfig: Record<ReportStatus, { bg: string; color: string }> = {
  draft: { bg: '#F0EDE4', color: '#5C5852' },
  submitted: { bg: '#FDDCB5', color: '#7A5C00' },
  reviewed: { bg: '#DBEAFE', color: '#1E40AF' },
  resolved: { bg: '#D8F3DC', color: '#1B4332' },
  open: { bg: '#FDDCB5', color: '#7A5C00' },
  in_review: { bg: '#DBEAFE', color: '#1E40AF' },
};

const severityBorder: Record<Severity, string> = {
  critical: '#E76F51',
  high: '#E9762B',
  medium: '#F4A261',
  low: '#457B9D',
};

const defaultFormState: ReportFormState = {
  title: '',
  description: '',
  type: 'incident',
  severity: 'medium',
};

function normalizeReports(payload: unknown): {
  reports: ApiReport[];
  total: number;
} {
  if (typeof payload !== 'object' || payload === null) {
    return { reports: [], total: 0 };
  }

  const source = payload as ReportsResponse;
  const reports = Array.isArray(source.reports) ? source.reports : [];
  const total =
    typeof source.total === 'number' && Number.isFinite(source.total)
      ? source.total
      : reports.length;

  return { reports, total };
}

function normalizeType(value?: string): ReportType {
  const normalized = value?.toLowerCase();
  if (
    normalized === 'incident' ||
    normalized === 'progress' ||
    normalized === 'maintenance'
  ) {
    return normalized;
  }
  return 'incident';
}

function normalizeSeverity(value?: string): Severity {
  const normalized = value?.toLowerCase();
  if (
    normalized === 'critical' ||
    normalized === 'high' ||
    normalized === 'medium' ||
    normalized === 'low'
  ) {
    return normalized;
  }
  return 'medium';
}

function normalizeStatus(value?: string): ReportStatus {
  const normalized = value?.toLowerCase();
  if (
    normalized === 'draft' ||
    normalized === 'submitted' ||
    normalized === 'reviewed' ||
    normalized === 'resolved' ||
    normalized === 'open' ||
    normalized === 'in_review'
  ) {
    return normalized;
  }
  return 'draft';
}

function toDisplayDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function toApiEnum(value: string): string {
  return value.toUpperCase();
}

/* ── Page ── */
function ReportsPageContent() {
  const t = useTranslations('reports');
  const tc = useTranslations('common');

  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [form, setForm] = useState<ReportFormState>(defaultFormState);
  const groupIdFilter = searchParams.get('group_id')?.trim() || undefined;

  const typeFilters: { value: ReportType | 'all'; label: string }[] = [
    { value: 'all', label: tc('all') },
    { value: 'incident', label: t('typeConfig.incident') },
    { value: 'progress', label: t('typeConfig.progress') },
    { value: 'maintenance', label: t('typeConfig.maintenance') },
  ];

  const severityFilters: { value: Severity | 'all'; label: string }[] = [
    { value: 'all', label: tc('all') },
    { value: 'critical', label: t('severityConfig.critical') },
    { value: 'high', label: t('severityConfig.high') },
    { value: 'medium', label: t('severityConfig.medium') },
    { value: 'low', label: t('severityConfig.low') },
  ];

  const statusFilters: { value: ReportStatus | 'all'; label: string }[] = [
    { value: 'all', label: tc('all') },
    { value: 'draft', label: t('statusConfig.draft') },
    { value: 'submitted', label: t('statusConfig.submitted') },
    { value: 'reviewed', label: t('statusConfig.reviewed') },
    { value: 'resolved', label: t('statusConfig.resolved') },
    { value: 'open', label: t('statusConfig.open') },
    { value: 'in_review', label: t('statusConfig.in_review') },
  ];

  const reportsQuery = useReports({
    type: typeFilter === 'all' ? undefined : typeFilter,
    severity: severityFilter === 'all' ? undefined : severityFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    group_id: groupIdFilter,
    limit: 50,
  });
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();

  const reportsData = useMemo(
    () => normalizeReports(reportsQuery.data),
    [reportsQuery.data],
  );

  const isLoading = reportsQuery.isLoading;
  const isError = reportsQuery.isError;

  const getApiErrorMessage = (error: unknown): string => {
    const fallback = t('fallbackError');

    if (typeof error !== 'object' || error === null) return fallback;

    const maybeError = error as {
      response?: { data?: { message?: string | string[] }; status?: number };
    };

    const message = maybeError.response?.data?.message;
    if (Array.isArray(message) && message.length > 0) {
      return message[0] ?? fallback;
    }
    if (typeof message === 'string' && message.trim()) return message;

    switch (maybeError.response?.status) {
      case 401:
        return t('sessionExpired');
      case 403:
        return t('noPermission');
      case 404:
        return t('notFoundError');
      default:
        return fallback;
    }
  };

  const errorMessage = getApiErrorMessage(reportsQuery.error);

  const openCreateDialog = () => {
    setForm(defaultFormState);
    setEditingReportId(null);
    setIsCreateOpen(true);
  };

  const openEditDialog = (report: ApiReport) => {
    setEditingReportId(report.id);
    setForm({
      title: report.title ?? '',
      description: report.description ?? '',
      type: normalizeType(report.type) as ReportFormState['type'],
      severity: normalizeSeverity(report.severity),
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error(t('validation.titleRequired'));
      return;
    }

    if (!form.description.trim()) {
      toast.error(t('validation.descriptionRequired'));
      return;
    }

    try {
      await createReport.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        type: toApiEnum(form.type),
        severity: toApiEnum(form.severity),
      });
      toast.success(t('toast.createSuccess'));
      setIsCreateOpen(false);
      setForm(defaultFormState);
    } catch (error) {
      toast.error(t('toast.createError'), {
        description: getApiErrorMessage(error),
      });
    }
  };

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingReportId) return;

    if (!form.title.trim()) {
      toast.error(t('validation.titleRequired'));
      return;
    }

    if (!form.description.trim()) {
      toast.error(t('validation.descriptionRequired'));
      return;
    }

    try {
      await updateReport.mutateAsync({
        id: editingReportId,
        data: {
          title: form.title.trim(),
          description: form.description.trim(),
          type: toApiEnum(form.type),
          severity: toApiEnum(form.severity),
        },
      });
      toast.success(t('toast.updateSuccess'));
      setIsEditOpen(false);
      setEditingReportId(null);
      setForm(defaultFormState);
    } catch (error) {
      toast.error(t('toast.updateError'), {
        description: getApiErrorMessage(error),
      });
    }
  };

  if (isLoading) {
    return (
      <div
        className="rounded-[16px] p-8 flex flex-col items-center justify-center gap-3"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: '#2D6A4F' }}
        />
        <p className="text-[14px]" style={{ color: '#5C5852' }}>
          {t('loading')}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-[16px] p-8"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <h2 className="font-display text-[24px]" style={{ color: '#E76F51' }}>
          {t('loadError')}
        </h2>
        <p className="text-[14px] mt-2" style={{ color: '#5C5852' }}>
          {errorMessage}
        </p>
        <Button
          onClick={() => void reportsQuery.refetch()}
          className="mt-4 rounded-[10px] h-10 px-4"
          style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          {tc('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {groupIdFilter && (
            <p className="text-[12px]" style={{ color: '#1B4332' }}>
              {t('groupFilterActive')}
            </p>
          )}
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-white text-[15px] font-semibold cursor-pointer transition-all duration-200"
          style={{ backgroundColor: '#2D6A4F' }}
          onClick={openCreateDialog}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow =
              '0 4px 20px rgba(45,106,79,0.15)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
          <Plus className="w-4 h-4" />
          {t('newReport')}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4">
        {/* Type Filter */}
        <div className="space-y-1.5">
          <span
            className="text-[12px] uppercase font-medium tracking-[0.05em]"
            style={{ color: '#5C5852' }}
          >
            {t('filterType')}
          </span>
          <div className="flex gap-1">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className="px-3 py-1.5 rounded-full text-[13px] font-medium cursor-pointer transition-colors"
                style={
                  typeFilter === f.value
                    ? { backgroundColor: '#2D6A4F', color: '#FFFFFF' }
                    : { backgroundColor: '#F0EDE4', color: '#5C5852' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity Filter */}
        <div className="space-y-1.5">
          <span
            className="text-[12px] uppercase font-medium tracking-[0.05em]"
            style={{ color: '#5C5852' }}
          >
            {t('filterSeverity')}
          </span>
          <div className="flex gap-1">
            {severityFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setSeverityFilter(f.value)}
                className="px-3 py-1.5 rounded-full text-[13px] font-medium cursor-pointer transition-colors"
                style={
                  severityFilter === f.value
                    ? { backgroundColor: '#2D6A4F', color: '#FFFFFF' }
                    : { backgroundColor: '#F0EDE4', color: '#5C5852' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div
        className="rounded-[16px] overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-7 gap-3 px-5 py-3 text-[12px] uppercase font-medium tracking-[0.05em]"
          style={{ backgroundColor: '#F0EDE4', color: '#5C5852' }}
        >
          <span>{t('tableHeaders.date')}</span>
          <span>{t('tableHeaders.type')}</span>
          <span className="col-span-2">{t('tableHeaders.title')}</span>
          <span>{t('tableHeaders.severity')}</span>
          <span>{t('tableHeaders.status')}</span>
          <span>{t('tableHeaders.actions')}</span>
        </div>

        {/* Rows */}
        {reportsData.reports.length > 0 ? (
          reportsData.reports.map((report) => {
            const type = normalizeType(report.type);
            const severity = normalizeSeverity(report.severity);
            const status = normalizeStatus(report.status);

            const typeInfo = typeIconConfig[type];
            const sev = severityStyleConfig[severity];
            const stat = statusStyleConfig[status];

            return (
              <div
                key={report.id}
                className="grid grid-cols-7 gap-3 px-5 py-3 items-center hover:bg-[#FAFAF7] transition-colors group"
                style={{
                  borderBottom: '1px solid #F0EDE4',
                  borderRight: `4px solid ${severityBorder[severity]}`,
                  minHeight: '52px',
                }}
              >
                <span
                  className="font-mono text-[13px]"
                  style={{ color: '#5C5852' }}
                >
                  {toDisplayDate(report.created_at)}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-[6px] w-fit"
                  style={{ backgroundColor: '#F0EDE4', color: '#2C2A24' }}
                >
                  {typeInfo.icon} {t(`typeConfig.${type}`)}
                </span>
                <span
                  className="col-span-2 text-[13px] truncate"
                  style={{ color: '#5C5852' }}
                  title={report.description ?? ''}
                >
                  {report.title ?? '—'}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                  style={{ backgroundColor: sev.bg, color: sev.color }}
                >
                  {sev.pulse && (
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        backgroundColor: sev.color,
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  )}
                  {t(`severityConfig.${severity}`)}
                </span>
                <span
                  className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                  style={{ backgroundColor: stat.bg, color: stat.color }}
                >
                  {t(`statusConfig.${status}`)}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    className="p-1.5 rounded-[6px] cursor-pointer hover:bg-[#F0EDE4]"
                    title={tc('edit')}
                    onClick={() => openEditDialog(report)}
                  >
                    <Pencil className="w-4 h-4" style={{ color: '#9C9890' }} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center">
            <div className="text-[40px] mb-3">📋</div>
            <h3
              className="font-display text-[24px] mb-1"
              style={{ color: '#5C5852' }}
            >
              {t('emptyTitle')}
            </h3>
            <p className="text-[14px]" style={{ color: '#9C9890' }}>
              {t('emptyDescription')}
            </p>
          </div>
        )}
      </div>

      <div className="text-[12px]" style={{ color: '#9C9890' }}>
        {t('totalReports')}: {reportsData.total}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{t('createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleCreateSubmit(event)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="create-title">
                {t('createDialog.titleLabel')}
              </Label>
              <Input
                id="create-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder={t('createDialog.titlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">
                {t('createDialog.descriptionLabel')}
              </Label>
              <Textarea
                id="create-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder={t('createDialog.descriptionPlaceholder')}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="create-type">
                  {t('createDialog.typeLabel')}
                </Label>
                <select
                  id="create-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      type: event.target.value as ReportFormState['type'],
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="incident">{t('typeConfig.incident')}</option>
                  <option value="progress">{t('typeConfig.progress')}</option>
                  <option value="maintenance">
                    {t('typeConfig.maintenance')}
                  </option>
                  <option value="other">{t('typeConfig.other')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-severity">
                  {t('createDialog.severityLabel')}
                </Label>
                <select
                  id="create-severity"
                  value={form.severity}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      severity: event.target.value as Severity,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="low">{t('severityConfig.low')}</option>
                  <option value="medium">{t('severityConfig.medium')}</option>
                  <option value="high">{t('severityConfig.high')}</option>
                  <option value="critical">
                    {t('severityConfig.critical')}
                  </option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createReport.isPending}
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
              >
                {createReport.isPending
                  ? t('createDialog.saving')
                  : t('createDialog.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>{t('editDialog.description')}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => void handleEditSubmit(event)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('createDialog.titleLabel')}</Label>
              <Input
                id="edit-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder={t('createDialog.titlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">
                {t('createDialog.descriptionLabel')}
              </Label>
              <Textarea
                id="edit-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder={t('createDialog.descriptionPlaceholder')}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-type">{t('createDialog.typeLabel')}</Label>
                <select
                  id="edit-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      type: event.target.value as ReportFormState['type'],
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="incident">{t('typeConfig.incident')}</option>
                  <option value="progress">{t('typeConfig.progress')}</option>
                  <option value="maintenance">
                    {t('typeConfig.maintenance')}
                  </option>
                  <option value="other">{t('typeConfig.other')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-severity">
                  {t('createDialog.severityLabel')}
                </Label>
                <select
                  id="edit-severity"
                  value={form.severity}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      severity: event.target.value as Severity,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="low">{t('severityConfig.low')}</option>
                  <option value="medium">{t('severityConfig.medium')}</option>
                  <option value="high">{t('severityConfig.high')}</option>
                  <option value="critical">
                    {t('severityConfig.critical')}
                  </option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={updateReport.isPending}
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
              >
                {updateReport.isPending
                  ? t('editDialog.saving')
                  : t('editDialog.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] w-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D6A4F]" />
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
