'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useMockActionFeedback } from '@/lib/hooks/use-mock-action-feedback';

/* ── D4 — Add Material Modal ── */

const CATEGORY_KEYS = [
  { value: 'feed', emoji: '🌾', key: 'categories.feed' },
  { value: 'vaccine', emoji: '💉', key: 'categories.vaccine' },
  { value: 'equipment', emoji: '🔧', key: 'categories.equipment' },
  { value: 'other', emoji: '📦', key: 'categories.other' },
] as const;

const UNIT_KEYS = ['units.kg', 'units.liter', 'units.unit', 'units.box'] as const;

interface AddMaterialModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddMaterialModal({ open, onClose }: AddMaterialModalProps) {
  const t = useTranslations('stock');
  const tc = useTranslations('common');

  const CATEGORIES = CATEGORY_KEYS.map((c) => ({
    ...c,
    label: t(c.key),
  }));

  const UNITS = UNIT_KEYS.map((k) => t(k));

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [initialQty, setInitialQty] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const { runMockAction, pendingActions } = useMockActionFeedback();
  const isSubmitting = !!pendingActions['add-material'];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-[480px] rounded-[24px] overflow-hidden page-enter"
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
          <h2 className="font-display text-[22px] text-white">
            {t('addMaterial')}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('materialName')} <span style={{ color: '#E76F51' }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
            />
          </div>

          {/* Category — icon grid */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('category')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className="flex flex-col items-center gap-1 p-3 rounded-[10px] cursor-pointer transition-all"
                  style={{
                    backgroundColor:
                      category === c.value ? '#D8F3DC' : '#F0EDE4',
                    border:
                      category === c.value
                        ? '2px solid #2D6A4F'
                        : '2px solid transparent',
                  }}
                >
                  <span className="text-[22px]">{c.emoji}</span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: '#2C2A24' }}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Unit — segmented control */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {tc('unit')}
            </label>
            <div
              className="flex rounded-[10px] overflow-hidden"
              style={{ backgroundColor: '#F0EDE4' }}
            >
              {UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className="flex-1 py-2.5 text-[14px] font-medium cursor-pointer transition-colors"
                  style={{
                    backgroundColor: unit === u ? '#2D6A4F' : 'transparent',
                    color: unit === u ? '#FFFFFF' : '#5C5852',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Quantity */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('initialQuantity')}
            </label>
            <input
              type="number"
              value={initialQty}
              onChange={(e) => setInitialQty(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[10px] text-[15px] font-mono outline-none"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
              dir="ltr"
            />
          </div>

          {/* Min Threshold */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('minThreshold')}
            </label>
            <input
              type="number"
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[10px] text-[15px] font-mono outline-none"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
              dir="ltr"
            />
            <p className="text-[12px]" style={{ color: '#9C9890' }}>
              {t('minThresholdHint')}
            </p>
          </div>

          {/* Unit Cost */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('unitCost')}{' '}
              <span className="text-[11px]" style={{ color: '#9C9890' }}>
                ({tc('optional')})
              </span>
            </label>
            <input
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[10px] text-[15px] font-mono outline-none"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
              dir="ltr"
              placeholder={t('currencySymbol')}
            />
            <p className="text-[12px]" style={{ color: '#9C9890' }}>
              {t('forFinancialTracking')}
            </p>
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
                actionKey: 'add-material',
                successTitle: t('addMaterialSuccess'),
                successDescription: name
                  ? t('addMaterialSuccessDescriptionNamed', { name })
                  : t('addMaterialSuccessDescription'),
                errorTitle: t('addMaterialError'),
                errorDescription: t('addMaterialErrorDescription'),
              });
              if (ok) onClose();
            }}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-[10px] text-white text-[14px] font-semibold cursor-pointer"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {isSubmitting ? tc('saving') : t('addMaterialButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
