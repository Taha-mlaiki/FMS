'use client';

import { useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Loader2, Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
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
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { usePermission } from '@/lib/hooks/use-permission';
import { useFarmDetails, useUpdateFarm } from '@/lib/hooks/api/use-farms';
import {
  useCreateMetricType,
  useDeleteMetricType,
  useMetricTypes,
  useUpdateMetricType,
} from '@/lib/hooks/api/use-metrics';
import {
  useDeleteTaskTemplate,
  useTaskTemplates,
  useUpdateTaskTemplateStatus,
} from '@/lib/hooks/api/use-tasks';

type SettingsTab = 'general' | 'metrics' | 'templates';

type ApiMetricType = {
  id?: string;
  name?: string;
  unit?: string;
  data_type?: string;
};

type ApiTemplate = {
  id: string;
  title?: string;
  recurrence?: string;
  worker_ids?: string[];
  group_ids?: string[];
  is_active?: boolean;
  status?: string;
  created_at?: string;
};

type MetricFormState = {
  id: string | null;
  name: string;
  unit: string;
  dataType: 'NUMBER' | 'DECIMAL';
};

const defaultMetricForm: MetricFormState = {
  id: null,
  name: '',
  unit: '',
  dataType: 'NUMBER',
};

interface ApiErrorMessages {
  sessionExpired: string;
  noPermission: string;
  dataNotFound: string;
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
  messages: ApiErrorMessages,
): string {
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
      return messages.sessionExpired;
    case 403:
      return messages.noPermission;
    case 404:
      return messages.dataNotFound;
    default:
      return fallback;
  }
}

function normalizeMetricTypes(payload: unknown): ApiMetricType[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.metric_types))
    return source.metric_types as ApiMetricType[];
  if (Array.isArray(source.items)) return source.items as ApiMetricType[];
  if (Array.isArray(source.data)) return source.data as ApiMetricType[];
  return [];
}

function normalizeTemplates(payload: unknown): ApiTemplate[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as Record<string, unknown>;
  if (Array.isArray(source.templates)) return source.templates as ApiTemplate[];
  if (Array.isArray(source.data)) return source.data as ApiTemplate[];
  return [];
}

function isTemplateActive(template: ApiTemplate): boolean {
  if (typeof template.is_active === 'boolean') return template.is_active;
  const status = String(template.status ?? '').toLowerCase();
  return status === 'active';
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const [metricForm, setMetricForm] =
    useState<MetricFormState>(defaultMetricForm);

  const { farm } = useFarmContext();
  const canManageMetrics = usePermission('manage:metric-types');
  const canUpdateTemplate = usePermission('update:task-template');
  const canDeleteTemplate = usePermission('delete:task-template');

  const farmDetailsQuery = useFarmDetails();
  const metricTypesQuery = useMetricTypes({ page: 1, limit: 100 });
  const templatesQuery = useTaskTemplates({ page: 1, limit: 100 });

  const updateFarm = useUpdateFarm();
  const createMetricType = useCreateMetricType();
  const updateMetricType = useUpdateMetricType();
  const deleteMetricType = useDeleteMetricType();
  const updateTemplateStatus = useUpdateTaskTemplateStatus();
  const deleteTemplate = useDeleteTaskTemplate();
  const metricTypes = useMemo(
    () => normalizeMetricTypes(metricTypesQuery.data),
    [metricTypesQuery.data],
  );
  const templates = useMemo(
    () => normalizeTemplates(templatesQuery.data),
    [templatesQuery.data],
  );

  const farmPayload = (farmDetailsQuery.data as Record<string, unknown>) ?? {};
  const farmNameFromApi =
    (typeof farmPayload.name === 'string' && farmPayload.name) ||
    farm?.name ||
    '';
  const farmLocationFromApi =
    (typeof farmPayload.location === 'string' && farmPayload.location) ||
    (typeof farmPayload.address === 'string' && farmPayload.address) ||
    '';

  const tabs = [
    { id: 'general' as SettingsTab, label: t('tabs.general') },
    { id: 'metrics' as SettingsTab, label: t('tabs.metrics') },
    { id: 'templates' as SettingsTab, label: t('tabs.templates') },
  ];

  const apiErrorMessages: ApiErrorMessages = {
    sessionExpired: t('sessionExpired'),
    noPermission: t('noPermission'),
    dataNotFound: t('dataNotFound'),
  };

  const openMetricCreate = () => {
    setMetricForm(defaultMetricForm);
    setIsMetricOpen(true);
  };

  const openMetricEdit = (metric: ApiMetricType) => {
    setMetricForm({
      id: metric.id ?? null,
      name: metric.name ?? '',
      unit: metric.unit ?? '',
      dataType:
        metric.data_type?.toUpperCase() === 'DECIMAL' ? 'DECIMAL' : 'NUMBER',
    });
    setIsMetricOpen(true);
  };

  const handleSaveGeneral = async () => {
    const nextName = farmName.trim() || farmNameFromApi;
    const nextLocation = farmLocation.trim() || farmLocationFromApi;

    if (!nextName) {
      toast.error(t('general.nameRequired'));
      return;
    }

    try {
      await updateFarm.mutateAsync({
        name: nextName,
        location: nextLocation || undefined,
      });
      toast.success(t('general.saveSuccess'));
      setFarmName('');
      setFarmLocation('');
    } catch (error) {
      toast.error(t('general.saveError'), {
        description: getApiErrorMessage(
          error,
          t('general.saveError'),
          apiErrorMessages,
        ),
      });
    }
  };

  const handleMetricSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();
    const name = metricForm.name.trim();
    const unit = metricForm.unit.trim();

    if (!name || !unit) {
      toast.error(t('metrics.nameAndUnitRequired'));
      return;
    }

    try {
      if (metricForm.id) {
        await updateMetricType.mutateAsync({
          id: metricForm.id,
          data: { name, unit, data_type: metricForm.dataType },
        });
        toast.success(t('metrics.updateSuccess'));
      } else {
        await createMetricType.mutateAsync({
          name,
          unit,
          data_type: metricForm.dataType,
        });
        toast.success(t('metrics.createSuccess'));
      }
      setMetricForm(defaultMetricForm);
      setIsMetricOpen(false);
    } catch (error) {
      toast.error(t('metrics.saveError'), {
        description: getApiErrorMessage(
          error,
          t('metrics.saveError'),
          apiErrorMessages,
        ),
      });
    }
  };

  const handleDeleteMetric = async (id?: string) => {
    if (!id) return;

    try {
      await deleteMetricType.mutateAsync(id);
      toast.success(t('metrics.deleteSuccess'));
    } catch (error) {
      toast.error(t('metrics.deleteError'), {
        description: getApiErrorMessage(
          error,
          t('metrics.deleteError'),
          apiErrorMessages,
        ),
      });
    }
  };

  const handleToggleTemplateStatus = async (template: ApiTemplate) => {
    try {
      await updateTemplateStatus.mutateAsync({
        id: template.id,
        isActive: !isTemplateActive(template),
      });
      toast.success(t('templates.statusUpdateSuccess'));
    } catch (error) {
      toast.error(t('templates.statusUpdateError'), {
        description: getApiErrorMessage(
          error,
          t('templates.statusUpdateError'),
          apiErrorMessages,
        ),
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync({ id });
      toast.success(t('templates.deleteSuccess'));
    } catch (error) {
      toast.error(t('templates.deleteError'), {
        description: getApiErrorMessage(
          error,
          t('templates.deleteError'),
          apiErrorMessages,
        ),
      });
    }
  };

  const isGeneralLoading = farmDetailsQuery.isLoading;
  const isMetricsLoading = metricTypesQuery.isLoading;
  const isTemplatesLoading = templatesQuery.isLoading;

  let generalContent: ReactNode;
  if (isGeneralLoading) {
    generalContent = (
      <div
        className="py-8 flex items-center justify-center gap-2 text-sm"
        style={{ color: '#5C5852' }}
      >
        <Loader2 className="w-4 h-4 animate-spin" /> {t('general.loading')}
      </div>
    );
  } else if (farmDetailsQuery.isError) {
    generalContent = (
      <div className="p-6 text-sm" style={{ color: '#B45309' }}>
        {getApiErrorMessage(
          farmDetailsQuery.error,
          t('general.loadError'),
          apiErrorMessages,
        )}
      </div>
    );
  } else {
    generalContent = (
      <>
        <div className="space-y-2">
          <Label>{t('general.farmName')}</Label>
          <Input
            value={farmName || farmNameFromApi}
            onChange={(event) => setFarmName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('general.location')}</Label>
          <Input
            value={farmLocation || farmLocationFromApi}
            onChange={(event) => setFarmLocation(event.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveGeneral} disabled={updateFarm.isPending}>
            {updateFarm.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {tc('saveChanges')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div
      className="flex gap-6 page-enter"
      style={{ minHeight: 'calc(100vh - 64px - 48px)' }}
    >
      <div
        className="w-50 shrink-0 rounded-lg p-3 h-fit sticky top-6"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full text-right px-4 py-2.5 rounded-md text-[14px] font-medium cursor-pointer transition-colors"
              style={
                activeTab === tab.id
                  ? { backgroundColor: '#F0FAF3', color: '#2D6A4F' }
                  : { backgroundColor: 'transparent', color: '#5C5852' }
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 min-w-0 space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h2
              className="font-display text-[22px]"
              style={{ color: '#2C2A24' }}
            >
              {t('general.title')}
            </h2>
            <div className="rounded-lg p-6 bg-white shadow-sm space-y-4">
              {generalContent}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="font-display text-[22px]"
                style={{ color: '#2C2A24' }}
              >
                {t('metrics.title')}
              </h2>
              {canManageMetrics && (
                <Button onClick={openMetricCreate}>
                  <Plus className="w-4 h-4" /> {t('metrics.addMetric')}
                </Button>
              )}
            </div>

            <div className="rounded-lg overflow-hidden bg-white shadow-sm">
              <div
                className="grid grid-cols-4 gap-3 px-5 py-3 text-[12px] uppercase font-medium tracking-[0.05em]"
                style={{ backgroundColor: '#F0EDE4', color: '#5C5852' }}
              >
                <span>{t('metrics.tableHeaders.name')}</span>
                <span>{t('metrics.tableHeaders.unit')}</span>
                <span>{t('metrics.tableHeaders.dataType')}</span>
                <span>{t('metrics.tableHeaders.actions')}</span>
              </div>

              {isMetricsLoading && (
                <div
                  className="py-8 flex items-center justify-center gap-2 text-sm"
                  style={{ color: '#5C5852' }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" /> {t('metrics.loading')}
                </div>
              )}

              {!isMetricsLoading && metricTypesQuery.isError && (
                <div className="p-6 text-sm" style={{ color: '#B45309' }}>
                  {getApiErrorMessage(
                    metricTypesQuery.error,
                    t('metrics.loadError'),
                    apiErrorMessages,
                  )}
                </div>
              )}

              {!isMetricsLoading &&
                !metricTypesQuery.isError &&
                metricTypes.length === 0 && (
                  <div className="p-6 text-sm" style={{ color: '#5C5852' }}>
                    {t('metrics.empty')}
                  </div>
                )}

              {!isMetricsLoading &&
                !metricTypesQuery.isError &&
                metricTypes.map((metric) => (
                  <div
                    key={metric.id || metric.name}
                    className="grid grid-cols-4 gap-3 px-5 py-3 items-center border-b border-[#F0EDE4]"
                  >
                    <span
                      className="text-[14px] font-medium"
                      style={{ color: '#2C2A24' }}
                    >
                      {metric.name || '-'}
                    </span>
                    <span className="text-[13px]" style={{ color: '#5C5852' }}>
                      {metric.unit || '-'}
                    </span>
                    <span className="text-[12px]" style={{ color: '#5C5852' }}>
                      {metric.data_type?.toUpperCase() === 'DECIMAL'
                        ? t('metrics.dataTypes.decimal')
                        : t('metrics.dataTypes.number')}
                    </span>
                    <div className="flex items-center gap-2">
                      {canManageMetrics && (
                        <>
                          <button
                            onClick={() => openMetricEdit(metric)}
                            className="p-1.5 rounded-sm cursor-pointer hover:bg-[#F0EDE4]"
                            title={tc('edit')}
                          >
                            <Pencil
                              className="w-4 h-4"
                              style={{ color: '#9C9890' }}
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteMetric(metric.id)}
                            className="p-1.5 rounded-sm cursor-pointer hover:bg-[#FFE4E6]"
                            title={tc('delete')}
                          >
                            <Trash2
                              className="w-4 h-4"
                              style={{ color: '#E76F51' }}
                            />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <h2
              className="font-display text-[22px]"
              style={{ color: '#2C2A24' }}
            >
              {t('templates.title')}
            </h2>

            <div className="rounded-lg overflow-hidden bg-white shadow-sm">
              <div
                className="grid grid-cols-6 gap-3 px-5 py-3 text-[12px] uppercase font-medium tracking-[0.05em]"
                style={{ backgroundColor: '#F0EDE4', color: '#5C5852' }}
              >
                <span>{t('templates.tableHeaders.title')}</span>
                <span>{t('templates.tableHeaders.recurrence')}</span>
                <span>{t('templates.tableHeaders.workers')}</span>
                <span>{t('templates.tableHeaders.groups')}</span>
                <span>{t('templates.tableHeaders.status')}</span>
                <span>{t('templates.tableHeaders.actions')}</span>
              </div>

              {isTemplatesLoading && (
                <div
                  className="py-8 flex items-center justify-center gap-2 text-sm"
                  style={{ color: '#5C5852' }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" /> {t('templates.loading')}
                </div>
              )}

              {!isTemplatesLoading && templatesQuery.isError && (
                <div className="p-6 text-sm" style={{ color: '#B45309' }}>
                  {getApiErrorMessage(
                    templatesQuery.error,
                    t('templates.loadError'),
                    apiErrorMessages,
                  )}
                </div>
              )}

              {!isTemplatesLoading &&
                !templatesQuery.isError &&
                templates.length === 0 && (
                  <div className="p-6 text-sm" style={{ color: '#5C5852' }}>
                    {t('templates.empty')}
                  </div>
                )}

              {!isTemplatesLoading &&
                !templatesQuery.isError &&
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="grid grid-cols-6 gap-3 px-5 py-3 items-center border-b border-[#F0EDE4]"
                  >
                    <span
                      className="text-[14px] font-medium"
                      style={{ color: '#2C2A24' }}
                    >
                      {template.title || t('templates.untitled')}
                    </span>
                    <span
                      className="text-[12px] font-mono"
                      style={{ color: '#5C5852' }}
                    >
                      {template.recurrence || '-'}
                    </span>
                    <span className="text-[12px]" style={{ color: '#5C5852' }}>
                      {Array.isArray(template.worker_ids)
                        ? template.worker_ids.length
                        : 0}
                    </span>
                    <span className="text-[12px]" style={{ color: '#5C5852' }}>
                      {Array.isArray(template.group_ids)
                        ? template.group_ids.length
                        : 0}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{
                        color: isTemplateActive(template)
                          ? '#166534'
                          : '#9C9890',
                      }}
                    >
                      {isTemplateActive(template) ? t('templates.statusActive') : t('templates.statusInactive')}
                    </span>
                    <div className="flex items-center gap-2">
                      {canUpdateTemplate && (
                        <button
                          onClick={() => handleToggleTemplateStatus(template)}
                          className="text-[12px] cursor-pointer hover:underline"
                          style={{ color: '#2D6A4F' }}
                        >
                          {isTemplateActive(template) ? t('templates.deactivate') : t('templates.activate')}
                        </button>
                      )}
                      {canDeleteTemplate && (
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 rounded-sm cursor-pointer hover:bg-[#FFE4E6]"
                          title={tc('delete')}
                        >
                          <Trash2
                            className="w-4 h-4"
                            style={{ color: '#E76F51' }}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isMetricOpen} onOpenChange={setIsMetricOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {metricForm.id ? t('metrics.dialog.editTitle') : t('metrics.dialog.createTitle')}
            </DialogTitle>
            <DialogDescription>{t('metrics.dialog.description')}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleMetricSubmit}>
            <div className="space-y-2">
              <Label htmlFor="metric-name">{t('metrics.dialog.name')}</Label>
              <Input
                id="metric-name"
                value={metricForm.name}
                onChange={(event) =>
                  setMetricForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metric-unit">{t('metrics.dialog.unit')}</Label>
              <Input
                id="metric-unit"
                value={metricForm.unit}
                onChange={(event) =>
                  setMetricForm((prev) => ({
                    ...prev,
                    unit: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metric-data-type">{t('metrics.dialog.dataType')}</Label>
              <select
                id="metric-data-type"
                value={metricForm.dataType}
                onChange={(event) =>
                  setMetricForm((prev) => ({
                    ...prev,
                    dataType:
                      event.target.value === 'DECIMAL' ? 'DECIMAL' : 'NUMBER',
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="NUMBER">{t('metrics.dataTypes.number')}</option>
                <option value="DECIMAL">{t('metrics.dataTypes.decimal')}</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  createMetricType.isPending || updateMetricType.isPending
                }
              >
                {createMetricType.isPending || updateMetricType.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {tc('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {(updateTemplateStatus.isPending || deleteTemplate.isPending) && (
        <div
          className="fixed bottom-4 left-4 rounded-lg bg-white border border-[#E4E0D8] px-3 py-2 text-xs flex items-center gap-2"
          style={{ color: '#5C5852' }}
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('templates.updatingTemplates')}
        </div>
      )}
    </div>
  );
}
