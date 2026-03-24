'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, ArrowRight } from 'lucide-react';
import { useMockActionFeedback } from '@/lib/hooks/use-mock-action-feedback';

/* ── D2 — Create Task Template Modal (3-step) ── */

const RECURRENCE_TYPE_KEYS = [
  { value: 'one-time', emoji: '📅', key: 'recurrence.oneTime', descKey: 'recurrence.oneTimeDesc' },
  { value: 'daily', emoji: '🔄', key: 'recurrence.daily', descKey: 'recurrence.dailyDesc' },
  { value: 'weekly', emoji: '📆', key: 'recurrence.weekly', descKey: 'recurrence.weeklyDesc' },
  { value: 'monthly', emoji: '🗓', key: 'recurrence.monthly', descKey: 'recurrence.monthlyDesc' },
  { value: 'specific', emoji: '🎯', key: 'recurrence.specific', descKey: 'recurrence.specificDesc' },
] as const;

const WEEKDAY_KEYS = [
  { value: 'sat', key: 'weekdays.sat' },
  { value: 'sun', key: 'weekdays.sun' },
  { value: 'mon', key: 'weekdays.mon' },
  { value: 'tue', key: 'weekdays.tue' },
  { value: 'wed', key: 'weekdays.wed' },
  { value: 'thu', key: 'weekdays.thu' },
  { value: 'fri', key: 'weekdays.fri' },
] as const;

const mockWorkers = [
  { id: '1', name: 'worker1' },
  { id: '2', name: 'worker2' },
];

const mockGroupKeys = [
  { id: '1', nameKey: 'mockGroups.broiler', icon: '🐔' },
  { id: '2', nameKey: 'mockGroups.layer', icon: '🥚' },
  { id: '3', nameKey: 'mockGroups.turkey', icon: '🦃' },
] as const;

interface CreateTaskTemplateModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTaskTemplateModal({
  open,
  onClose,
}: CreateTaskTemplateModalProps) {
  const t = useTranslations('tasks');
  const ts = useTranslations('settings.templates');
  const tc = useTranslations('common');

  const RECURRENCE_TYPES = RECURRENCE_TYPE_KEYS.map((rt) => ({
    ...rt,
    label: t(rt.key),
    desc: t(rt.descKey),
  }));

  const WEEKDAYS = WEEKDAY_KEYS.map((d) => ({
    ...d,
    label: t(d.key),
  }));

  const mockGroups = mockGroupKeys.map((g) => ({
    ...g,
    name: t(g.nameKey),
  }));

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(true);
  const [recurrenceType, setRecurrenceType] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState('08:00');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const { runMockAction, pendingActions } = useMockActionFeedback();
  const isSubmitting = !!pendingActions['create-task-template'];

  if (!open) return null;

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function toggleWorker(id: string) {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
    );
  }

  function toggleGroup(id: string) {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  const stepTitles = [ts('stepBasicInfo'), ts('stepRecurrence'), ts('stepAssignment')];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-[600px] rounded-[24px] overflow-hidden page-enter"
        style={{
          boxShadow:
            '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4" style={{ backgroundColor: '#0D2818' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[22px] text-white">
              {stepTitles[step - 1]}
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s <= step ? '#52B788' : '#1B4332' }}
                />
                {s < 3 && (
                  <div
                    className="w-8 h-[1px]"
                    style={{
                      backgroundColor: s < step ? '#52B788' : '#1B4332',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          className="p-8 space-y-5 max-h-[60vh] overflow-y-auto"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label
                  className="text-[13px] font-medium"
                  style={{ color: '#5C5852' }}
                >
                  {t('taskTitle')} <span style={{ color: '#E76F51' }}>*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none"
                  style={{
                    backgroundColor: '#F0EDE4',
                    border: '1px solid #E4E0D8',
                    color: '#2C2A24',
                  }}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-[13px] font-medium"
                  style={{ color: '#5C5852' }}
                >
                  {tc('description')}{' '}
                  <span className="text-[11px]" style={{ color: '#9C9890' }}>
                    ({tc('optional')})
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-[10px] text-[15px] outline-none resize-none"
                  style={{
                    backgroundColor: '#F0EDE4',
                    border: '1px solid #E4E0D8',
                    color: '#2C2A24',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('startDate')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none"
                    style={{
                      backgroundColor: '#F0EDE4',
                      border: '1px solid #E4E0D8',
                      color: '#2C2A24',
                    }}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[13px] font-medium"
                      style={{ color: '#5C5852' }}
                    >
                      {t('endDate')}
                    </label>
                    <label
                      className="flex items-center gap-1.5 text-[12px] cursor-pointer"
                      style={{ color: '#9C9890' }}
                    >
                      <input
                        type="checkbox"
                        checked={noEndDate}
                        onChange={(e) => setNoEndDate(e.target.checked)}
                        className="accent-[#2D6A4F]"
                      />
                      {t('noEndDate')}
                    </label>
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={noEndDate}
                    className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none disabled:opacity-40"
                    style={{
                      backgroundColor: '#F0EDE4',
                      border: '1px solid #E4E0D8',
                      color: '#2C2A24',
                    }}
                    dir="ltr"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2 — Recurrence */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {RECURRENCE_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setRecurrenceType(rt.value)}
                    className="flex items-start gap-3 p-4 rounded-[10px] cursor-pointer transition-all text-right"
                    style={{
                      backgroundColor:
                        recurrenceType === rt.value ? '#D8F3DC' : '#F0EDE4',
                      border:
                        recurrenceType === rt.value
                          ? '2px solid #2D6A4F'
                          : '2px solid transparent',
                    }}
                  >
                    <span className="text-[20px]">{rt.emoji}</span>
                    <div>
                      <p
                        className="text-[14px] font-medium"
                        style={{ color: '#2C2A24' }}
                      >
                        {rt.label}
                      </p>
                      <p className="text-[12px]" style={{ color: '#9C9890' }}>
                        {rt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Weekly days */}
              {recurrenceType === 'weekly' && (
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('weekDays')}
                  </label>
                  <div className="flex gap-2">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className="px-3 py-1.5 rounded-full text-[13px] font-medium cursor-pointer"
                        style={{
                          backgroundColor: selectedDays.includes(d.value)
                            ? '#2D6A4F'
                            : '#F0EDE4',
                          color: selectedDays.includes(d.value)
                            ? '#FFFFFF'
                            : '#5C5852',
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time picker */}
              <div className="space-y-2">
                <label
                  className="text-[13px] font-medium"
                  style={{ color: '#5C5852' }}
                >
                  {t('time')}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-[140px] h-[48px] px-4 rounded-[10px] text-[15px] font-mono outline-none"
                  style={{
                    backgroundColor: '#F0EDE4',
                    border: '1px solid #E4E0D8',
                    color: '#2C2A24',
                  }}
                  dir="ltr"
                />
              </div>

              {/* Preview */}
              {recurrenceType && (
                <div
                  className="rounded-[10px] p-4 text-[14px] italic"
                  style={{ backgroundColor: '#F0FAF3', color: '#1B4332' }}
                >
                  {recurrenceType === 'daily' &&
                    t('preview.daily', { time })}
                  {recurrenceType === 'weekly' &&
                    t('preview.weekly', { days: selectedDays.length > 0 ? selectedDays.map((d) => WEEKDAYS.find((w) => w.value === d)?.label).join(', ') : '...', time })}
                  {recurrenceType === 'one-time' &&
                    t('preview.oneTime', { time })}
                  {recurrenceType === 'monthly' &&
                    t('preview.monthly', { time })}
                  {recurrenceType === 'specific' &&
                    t('preview.specific', { time })}
                </div>
              )}
            </>
          )}

          {/* Step 3 — Assignment */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-6">
              {/* Workers */}
              <div className="space-y-3">
                <label
                  className="text-[13px] font-medium"
                  style={{ color: '#5C5852' }}
                >
                  {t('assignWorkers')}
                </label>
                <div className="space-y-2">
                  {mockWorkers.map((w) => (
                    <label
                      key={w.id}
                      className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-colors"
                      style={{
                        backgroundColor: selectedWorkers.includes(w.id)
                          ? '#D8F3DC'
                          : '#F0EDE4',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(w.id)}
                        onChange={() => toggleWorker(w.id)}
                        className="accent-[#2D6A4F] w-4 h-4"
                      />
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold text-white"
                        style={{ backgroundColor: '#2D6A4F' }}
                      >
                        {t(`mockWorkers.${w.name}`).charAt(0)}
                      </div>
                      <span
                        className="text-[14px]"
                        style={{ color: '#2C2A24' }}
                      >
                        {t(`mockWorkers.${w.name}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Groups */}
              <div className="space-y-3">
                <label
                  className="text-[13px] font-medium"
                  style={{ color: '#5C5852' }}
                >
                  {t('assignGroups')}
                </label>
                <div className="space-y-2">
                  {mockGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-colors"
                      style={{
                        backgroundColor: selectedGroups.includes(g.id)
                          ? '#D8F3DC'
                          : '#F0EDE4',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(g.id)}
                        onChange={() => toggleGroup(g.id)}
                        className="accent-[#2D6A4F] w-4 h-4"
                      />
                      <span className="text-[16px]">{g.icon}</span>
                      <span
                        className="text-[14px]"
                        style={{ color: '#2C2A24' }}
                      >
                        {g.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-8 py-4"
          style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #F0EDE4' }}
        >
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1 text-[14px] font-medium cursor-pointer"
                style={{ color: '#5C5852' }}
              >
                <ArrowRight className="w-4 h-4" />
                {ts('previous')}
              </button>
            )}
          </div>
          <button
            onClick={async () => {
              if (step < 3) {
                setStep((s) => (s + 1) as 1 | 2 | 3);
                return;
              }

              const ok = await runMockAction({
                actionKey: 'create-task-template',
                successTitle: ts('createTemplateSuccess'),
                successDescription: title
                  ? ts('createTemplateSuccessDescriptionNamed', { title })
                  : ts('createTemplateSuccessDescription'),
                errorTitle: ts('createTemplateError'),
                errorDescription: ts('createTemplateErrorDescription'),
              });

              if (ok) onClose();
            }}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-[10px] text-white text-[14px] font-semibold cursor-pointer"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {step === 3
              ? isSubmitting
                ? tc('saving')
                : ts('createTemplate')
              : ts('next')}
          </button>
        </div>
      </div>
    </div>
  );
}
