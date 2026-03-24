'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useMockActionFeedback } from '@/lib/hooks/use-mock-action-feedback';

/* ── D5 — Record Transaction Modal ── */

const TRANSACTION_TYPE_KEYS = [
  { value: 'purchase', emoji: '🛒', key: 'transactionTypes.purchase', color: '#D8F3DC', descKey: 'transactionTypes.purchaseDesc' },
  { value: 'consumption', emoji: '⬇', key: 'transactionTypes.consumption', color: '#FDDCB5', descKey: 'transactionTypes.consumptionDesc' },
  { value: 'damage', emoji: '💥', key: 'transactionTypes.damage', color: '#FDDCB5', descKey: 'transactionTypes.damageDesc' },
  { value: 'adjustment', emoji: '🔄', key: 'transactionTypes.adjustment', color: '#F0EDE4', descKey: 'transactionTypes.adjustmentDesc' },
] as const;

const mockMaterials = [
  { id: '1', name: 'starterFeed', currentStock: 150 },
  { id: '2', name: 'growerFeed', currentStock: 80 },
  { id: '3', name: 'newcastleVaccine', currentStock: 45 },
  { id: '4', name: 'vitamins', currentStock: 12 },
];

const mockGroups = [
  { id: '1', name: 'broiler' },
  { id: '2', name: 'layer' },
];

interface RecordTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

export function RecordTransactionModal({
  open,
  onClose,
}: RecordTransactionModalProps) {
  const t = useTranslations('stock');
  const tc = useTranslations('common');

  const TRANSACTION_TYPES = TRANSACTION_TYPE_KEYS.map((tt) => ({
    ...tt,
    label: t(tt.key),
    desc: t(tt.descKey),
  }));

  const [materialId, setMaterialId] = useState('');
  const [txType, setTxType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [groupId, setGroupId] = useState('');
  const [notes, setNotes] = useState('');
  const { runMockAction, pendingActions } = useMockActionFeedback();
  const isSubmitting = !!pendingActions['record-transaction'];

  if (!open) return null;

  const selectedMaterial = mockMaterials.find((m) => m.id === materialId);
  const selectedType = TRANSACTION_TYPES.find((t) => t.value === txType);

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
          <h2 className="font-display text-[22px] text-white">{t('recordTransaction')}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          {/* Material — searchable select */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('material')}
            </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none cursor-pointer"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
            >
              <option value="">{t('selectMaterial')}</option>
              {mockMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {t(`mockMaterials.${m.name}`)}
                </option>
              ))}
            </select>
            {selectedMaterial && (
              <p className="text-[12px]" style={{ color: '#9C9890' }}>
                {t('currentStock')}{' '}
                <span className="font-mono">
                  {selectedMaterial.currentStock}
                </span>
              </p>
            )}
          </div>

          {/* Transaction Type — 2×2 grid */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('transactionType')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTION_TYPES.map((tt) => (
                <button
                  key={tt.value}
                  type="button"
                  onClick={() => setTxType(tt.value)}
                  className="flex items-center gap-2 p-3 rounded-[10px] cursor-pointer transition-all text-right"
                  style={{
                    backgroundColor: txType === tt.value ? tt.color : '#F0EDE4',
                    border:
                      txType === tt.value
                        ? '2px solid #2D6A4F'
                        : '2px solid transparent',
                  }}
                >
                  <span className="text-[18px]">{tt.emoji}</span>
                  <span
                    className="text-[14px] font-medium"
                    style={{ color: '#2C2A24' }}
                  >
                    {tt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {tc('quantity')}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[10px] text-[15px] font-mono outline-none"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
              dir="ltr"
            />
            {selectedType && (
              <p className="text-[12px]" style={{ color: '#9C9890' }}>
                {selectedType.desc}
              </p>
            )}
          </div>

          {/* Unit Cost (purchase only) */}
          {txType === 'purchase' && (
            <div className="space-y-2">
              <label
                className="text-[13px] font-medium"
                style={{ color: '#5C5852' }}
              >
                {t('unitCost')}
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
            </div>
          )}

          {/* Linked Group */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('linkedGroup')}{' '}
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
              <option value="">{t('noGroup')}</option>
              {mockGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {tc('notes')}{' '}
              <span className="text-[11px]" style={{ color: '#9C9890' }}>
                ({tc('optional')})
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-[10px] text-[14px] outline-none resize-none"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#2C2A24',
              }}
            />
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
                actionKey: 'record-transaction',
                successTitle: t('recordTransactionSuccess'),
                successDescription: selectedMaterial
                  ? t('recordTransactionSuccessDescriptionNamed', { type: selectedType?.label ?? t('material'), name: t(`mockMaterials.${selectedMaterial.name}`) })
                  : t('recordTransactionSuccessDescription'),
                errorTitle: t('recordTransactionError'),
                errorDescription: t('recordTransactionErrorDescription'),
              });
              if (ok) onClose();
            }}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-[10px] text-white text-[14px] font-semibold cursor-pointer"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {isSubmitting ? tc('saving') : t('recordTransactionButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
