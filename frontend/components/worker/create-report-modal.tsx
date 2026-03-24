'use client';

import { useTranslations } from 'next-intl';

import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

type ReportType = 'incident' | 'progress' | 'maintenance';
type Severity = 'low' | 'medium' | 'high' | 'critical';

type GroupOption = {
  id: string;
  name: string;
};

type CreateReportPayload = {
  type: ReportType;
  severity: Severity;
  description: string;
  title: string;
  group_ids?: string[];
  task_id?: string;
};

type CreateReportModalProps = {
  open: boolean;
  onClose: () => void;
  isSubmitting?: boolean;
  groups: GroupOption[];
  onSubmit: (payload: CreateReportPayload) => Promise<void>;
};

export function CreateReportModal(props: Readonly<CreateReportModalProps>) {
  const t = useTranslations('reportsWorker');
  const tCommon = useTranslations('common');
  const REPORT_TYPES: Array<{
    value: ReportType;
    label: string;
    icon: string;
  }> = [
    { value: 'incident', label: t('incident'), icon: t('incidentIcon') || '⚠' },
    { value: 'progress', label: 'Progress', icon: '📈' },
    { value: 'maintenance', label: 'Maintenance', icon: '🛠' },
  ];

  const SEVERITY_OPTIONS: Array<{
    value: Severity;
    label: string;
    bg: string;
    color: string;
  }> = [
    { value: 'low', label: t('low'), bg: '#DBEAFE', color: '#1E40AF' },
    { value: 'medium', label: t('medium'), bg: '#FDDCB5', color: '#7A5C00' },
    { value: 'high', label: t('high'), bg: '#F4A261', color: '#2C2A24' },
    {
      value: 'critical',
      label: t('critical'),
      bg: '#FFE4E6',
      color: '#E76F51',
    },
  ];

  const TITLE_BY_TYPE: Record<ReportType, string> = {
    incident: t('incident'),
    progress: 'Progress Report',
    maintenance: 'Maintenance Report',
  };

  const [type, setType] = useState<ReportType>('incident');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [groupId, setGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    const hasDescription = description.trim().length >= 10;
    if (!hasDescription) return false;
    return true;
  }, [description]);

  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      dir="rtl"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={props.onClose}
        aria-label={tCommon('close')}
      />

      <div
        className="relative w-full max-h-[92vh] overflow-hidden rounded-t-[20px] sm:max-h-[88vh] sm:max-w-140 sm:rounded-[20px]"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 10px 36px rgba(15,14,12,0.2), 0 4px 14px rgba(15,14,12,0.14)',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(135deg, #0D2818, #1B4332)' }}
        >
          <h2 className="font-display text-[22px] text-white">
            {t('newReportTitle')}
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            className="cursor-pointer text-white/70 hover:text-white"
            aria-label={tCommon('close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          <div className="space-y-2">
            <p className="text-[13px] font-medium" style={{ color: '#5C5852' }}>
              {t('typeLabel')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setType(item.value)}
                  className="cursor-pointer rounded-md border px-3 py-2 text-right transition-colors"
                  style={{
                    borderColor: type === item.value ? '#2D6A4F' : '#E4E0D8',
                    backgroundColor:
                      type === item.value ? '#EAF7EE' : '#FAFAF7',
                  }}
                >
                  <span className="text-[18px]">{item.icon}</span>
                  <span
                    className="mr-2 text-[14px] font-medium"
                    style={{ color: '#2C2A24' }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-medium" style={{ color: '#5C5852' }}>
              {t('severityLabel')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSeverity(item.value)}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-semibold"
                  style={{
                    backgroundColor: item.bg,
                    color: item.color,
                    outline:
                      severity === item.value ? '2px solid #2D6A4F' : 'none',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="report-group"
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('groupLabel')}
            </label>
            <select
              id="report-group"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">{t('noGroup')}</option>
              {props.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="report-description"
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('descLabel')}
            </label>
            <textarea
              id="report-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('writeDescription')}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
            <p
              className="text-[11px]"
              style={{
                color: description.trim().length < 10 ? '#E76F51' : '#9C9890',
              }}
            >
              {t('atLeast10Chars', { count: description.trim().length })}
            </p>
          </div>

          {error ? (
            <p
              className="rounded-md px-3 py-2 text-[12px]"
              style={{ backgroundColor: '#FFE4E6', color: '#9F1239' }}
            >
              {error}
            </p>
          ) : null}
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          style={{ borderColor: '#F0EDE4' }}
        >
          <button
            type="button"
            onClick={props.onClose}
            className="cursor-pointer rounded-md px-4 py-2 text-[13px]"
            style={{ color: '#5C5852' }}
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit || Boolean(props.isSubmitting)}
            onClick={async () => {
              setError('');

              if (!canSubmit) {
                setError(t('invalidInput'));
                return;
              }

              try {
                await props.onSubmit({
                  type,
                  severity,
                  group_ids: groupId ? [groupId] : undefined,
                  title: TITLE_BY_TYPE[type],
                  description: description.trim(),
                });

                setDescription('');
                setGroupId('');
                setType('incident');
                setSeverity('medium');
                props.onClose();
              } catch {
                setError(t('submitError'));
              }
            }}
            className="inline-flex items-center rounded-md px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {props.isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submitReportButton')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
