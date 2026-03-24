'use client';

import { useMemo } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useTaskTemplates,
  useDeleteTaskTemplate,
  useUpdateTaskTemplateStatus,
} from '@/lib/hooks/api/use-tasks';
import { usePermission } from '@/lib/hooks/use-permission';
import { useTaskStore } from '@/lib/stores/task.store';
import {
  TemplateCard,
  type TemplateCardData,
} from './template-card';

/* ── Types ── */

type ApiTemplate = Record<string, unknown>;

/* ── Helpers ── */

function normalizeTemplates(payload: unknown): {
  list: TemplateCardData[];
  total: number;
} {
  if (Array.isArray(payload)) {
    return {
      list: payload as TemplateCardData[],
      total: payload.length,
    };
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
  const list = listSource as TemplateCardData[];
  const total =
    typeof source.total === 'number' && Number.isFinite(source.total)
      ? source.total
      : list.length;
  return { list, total };
}

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

const TEMPLATE_PAGE_SIZE = 20;

/* ── Component ── */

export function TemplatesTab() {
  const t = useTranslations('tasks.templates');
  const tc = useTranslations('common');

  const {
    templatePage,
    setTemplatePage,
    openEditDialog,
    setIsCreateDialogOpen,
    deletingTemplateId,
    setDeletingTemplateId,
  } = useTaskStore();

  const canCreate = usePermission('create:task-template');
  const canEdit = usePermission('create:task-template');

  const templatesQuery = useTaskTemplates({
    page: templatePage,
    limit: TEMPLATE_PAGE_SIZE,
    recurrence: 'recurring',
  });
  const deleteTemplate = useDeleteTaskTemplate();
  const toggleStatus = useUpdateTaskTemplateStatus();

  const { list: templates, total } = useMemo(
    () => normalizeTemplates(templatesQuery.data),
    [templatesQuery.data],
  );

  const isLoading = templatesQuery.isLoading;
  const isError = templatesQuery.isError;
  const hasTemplates = templates.length > 0;
  const totalPages = Math.max(1, Math.ceil(total / TEMPLATE_PAGE_SIZE));

  /* ── Handlers ── */

  const handleEdit = (template: TemplateCardData) => {
    openEditDialog(template as unknown as Record<string, unknown>);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTemplateId) return;
    try {
      await deleteTemplate.mutateAsync({ id: deletingTemplateId });
      toast.success(t('deleteSuccess'));
      setDeletingTemplateId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('deleteError')));
    }
  };

  const handleToggleActive = async (id: string, newActiveState: boolean) => {
    try {
      await toggleStatus.mutateAsync({ id, isActive: newActiveState });
      toast.success(newActiveState ? t('activateSuccess') : t('deactivateSuccess'));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t('toggleStatusError')),
      );
    }
  };

  /* ── Stats ── */

  const stats = useMemo(() => {
    const active = templates.filter(
      (tmpl) => (tmpl.is_active ?? tmpl.isActive) !== false,
    ).length;
    const paused = templates.length - active;
    const daily = templates.filter(
      (tmpl) => tmpl.recurrence === 'daily',
    ).length;
    const weekly = templates.filter(
      (tmpl) => tmpl.recurrence === 'weekly',
    ).length;
    return { total: templates.length, active, paused, daily, weekly };
  }, [templates]);

  /* ── Render ── */

  return (
    <div className="space-y-5">
      {/* Info banner about auto-generation */}
      <div
        className="rounded-xl px-5 py-4 flex items-start gap-3"
        style={{
          backgroundColor: '#F0FAF3',
          border: '1px solid #B7E4C7',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: '#D8F3DC' }}
        >
          <RefreshCw className="w-4 h-4" style={{ color: '#2D6A4F' }} />
        </div>
        <div>
          <p
            className="text-[14px] font-semibold mb-0.5"
            style={{ color: '#1B4332' }}
          >
            {t('autoGenTitle')}
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#2D6A4F' }}>
            {t('autoGenDescription')}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: t('totalTemplates'),
            value: total,
            bg: '#F0EDE4',
            color: '#5C5852',
          },
          {
            label: t('activeTemplates'),
            value: stats.active,
            bg: '#D8F3DC',
            color: '#1B4332',
          },
          {
            label: t('dailyTemplates'),
            value: stats.daily,
            bg: '#EEF7FF',
            color: '#1E40AF',
          },
          {
            label: t('weeklyTemplates'),
            value: stats.weekly,
            bg: '#F5F3FF',
            color: '#5B21B6',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-4 py-3 flex flex-col"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(15,14,12,0.05)',
            }}
          >
            <span className="text-[20px] font-bold" style={{ color: '#2C2A24' }}>
              {stat.value}
            </span>
            <span className="text-[11px] mt-0.5" style={{ color: '#9C9890' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Loading */}
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
            {t('loadingTemplates')}
          </span>
        </div>
      )}

      {/* Error */}
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
                {getApiErrorMessage(
                  templatesQuery.error,
                  t('loadTemplatesError'),
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => templatesQuery.refetch()}
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                {tc('retry')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && !hasTemplates && (
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
            <FileText className="w-7 h-7" style={{ color: '#9C9890' }} />
          </div>
          <p
            className="text-[16px] font-semibold mb-1"
            style={{ color: '#2C2A24' }}
          >
            {t('noTemplates')}
          </p>
          <p
            className="text-[13px] mb-5 max-w-sm mx-auto"
            style={{ color: '#9C9890' }}
          >
            {t('noTemplatesDescription')}
          </p>
          {canCreate && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="rounded-xl h-11 px-6 text-[14px] font-semibold cursor-pointer gap-2"
              style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
            >
              <Plus className="w-4 h-4" />
              {t('createTemplate')}
            </Button>
          )}
        </div>
      )}

      {/* Template list */}
      {!isLoading && !isError && hasTemplates && (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDelete={(id) => setDeletingTemplateId(id)}
              onToggleActive={handleToggleActive}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && total > TEMPLATE_PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            type="button"
            onClick={() => setTemplatePage(templatePage - 1)}
            disabled={templatePage <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0EDE4]"
            style={{ color: '#5C5852' }}
          >
            {tc('previous')}
          </button>
          <span className="text-[13px]" style={{ color: '#9C9890' }}>
            {t('pageInfo', { current: templatePage, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={() => setTemplatePage(templatePage + 1)}
            disabled={templatePage >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0EDE4]"
            style={{ color: '#5C5852' }}
          >
            {tc('next')}
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={Boolean(deletingTemplateId)}
        title={t('deleteTemplateTitle')}
        description={t('deleteTemplateDescription')}
        confirmLabel={t('deleteConfirmBtn')}
        confirmVariant="danger"
        isLoading={deleteTemplate.isPending}
        onOpenChange={(open) => {
          if (!open) setDeletingTemplateId(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
