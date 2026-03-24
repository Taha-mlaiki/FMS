'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useMockActionFeedback } from '@/lib/hooks/use-mock-action-feedback';

/* ── D6 — Create Report Modal ── */

const REPORT_TYPE_KEYS = [
  { value: 'mortality', emoji: '🐔', key: 'reportTypes.mortality' },
  { value: 'damage', emoji: '🔧', key: 'reportTypes.damage' },
  { value: 'disease', emoji: '🦠', key: 'reportTypes.disease' },
  { value: 'incident', emoji: '⚠', key: 'reportTypes.incident' },
] as const;

const SEVERITY_KEYS = [
  { value: 'low', emoji: '🔵', key: 'severities.low', color: '#457B9D' },
  { value: 'medium', emoji: '🟡', key: 'severities.medium', color: '#F4A261' },
  { value: 'high', emoji: '🟠', key: 'severities.high', color: '#E9762B' },
  { value: 'critical', emoji: '🔴', key: 'severities.critical', color: '#E76F51' },
] as const;

const mockGroups = [
  { id: '1', name: 'broiler' },
  { id: '2', name: 'layer' },
  { id: '3', name: 'turkey' },
];

interface CreateReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateReportModal({ open, onClose }: CreateReportModalProps) {
  const t = useTranslations('reports');
  const tc = useTranslations('common');

  const REPORT_TYPES = REPORT_TYPE_KEYS.map((rt) => ({
    ...rt,
    label: t(rt.key),
  }));

  const SEVERITIES = SEVERITY_KEYS.map((s) => ({
    ...s,
    label: t(s.key),
  }));

  const [reportType, setReportType] = useState('');
  const [groupId, setGroupId] = useState('');
  const [severity, setSeverity] = useState('');
  const [affected, setAffected] = useState('');
  const [description, setDescription] = useState('');
  const { runMockAction, pendingActions } = useMockActionFeedback();
  const isSubmitting = !!pendingActions['create-report'];

  if (!open) return null;

  const showAffected = reportType === 'mortality' || reportType === 'disease';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-[520px] rounded-[24px] overflow-hidden page-enter"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: '#0D2818' }}
        >
          <h2 className="font-display text-[22px] text-white">{t('newReport')}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          {/* Report Type — 2×2 grid */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('reportType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setReportType(rt.value)}
                  className="flex items-center gap-2 p-3 rounded-[10px] cursor-pointer transition-all text-right"
                  style={{
                    backgroundColor:
                      reportType === rt.value ? '#D8F3DC' : '#F0EDE4',
                    border:
                      reportType === rt.value
                        ? '2px solid #2D6A4F'
                        : '2px solid transparent',
                  }}
                >
                  <span className="text-[20px]">{rt.emoji}</span>
                  <span
                    className="text-[14px] font-medium"
                    style={{ color: '#2C2A24' }}
                  >
                    {rt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Animal Group */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('animalGroup')}{' '}
              <span className="text-[11px]" style={{ color: '#9C9890' }}>
                ({tc('optional')})
              </span>
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none cursor-pointer"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
            >
              <option value="">{t('notLinkedToGroup')}</option>
              {mockGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('severity')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-[10px] cursor-pointer transition-all"
                  style={{
                    backgroundColor:
                      severity === s.value ? '#F0EDE4' : 'transparent',
                    border:
                      severity === s.value
                        ? `2px solid ${s.color}`
                        : '2px solid #E4E0D8',
                  }}
                >
                  <span className="text-[16px]">{s.emoji}</span>
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: '#2C2A24' }}
                  >
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Affected Count */}
          {showAffected && (
            <div className="space-y-2">
              <label
                className="text-[13px] font-medium"
                style={{ color: '#5C5852' }}
              >
                {t('affectedCount')}
              </label>
              <input
                type="number"
                value={affected}
                onChange={(e) => setAffected(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[10px] text-[15px] font-mono outline-none"
                style={{
                  backgroundColor: '#F0EDE4',
                  border: '1px solid #E4E0D8',
                  color: '#2C2A24',
                }}
                dir="ltr"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {tc('description')} <span style={{ color: '#E76F51' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-[10px] text-[14px] outline-none resize-none"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
              placeholder={t('descriptionPlaceholder')}
            />
            <div className="flex justify-end">
              <span
                className="text-[12px]"
                style={{
                  color: description.length < 10 ? '#E76F51' : '#9C9890',
                }}
              >
                {t('minCharsCount', { count: description.length, min: 10 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-8 py-4"
          style={{ borderTop: '1px solid #F0EDE4' }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[10px] text-[14px] font-medium cursor-pointer"
            style={{ color: '#5C5852' }}
          >
            {tc('cancel')}
          </button>
          <button
            onClick={async () => {
              const ok = await runMockAction({
                actionKey: 'create-report',
                successTitle: t('createReportSuccess'),
                successDescription:
                  description.length > 20
                    ? `${description.slice(0, 20)}...`
                    : description || t('createReportSuccessDescription'),
                errorTitle: t('createReportError'),
                errorDescription: t('createReportErrorDescription'),
              });
              if (ok) onClose();
            }}
            className="px-5 py-2.5 rounded-[10px] text-white text-[14px] font-semibold cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: '#2D6A4F' }}
            disabled={description.length < 10 || isSubmitting}
          >
            {isSubmitting ? tc('saving') : t('createReport')}
          </button>
        </div>
      </div>
    </div>
  );
}
