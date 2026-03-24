'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

/* ── D1 — Create Group Modal ── */

const ENTITY_TYPE_KEYS = [
  { value: 'broiler', emoji: '🐔', key: 'entityTypes.broiler' },
  { value: 'layer', emoji: '🥚', key: 'entityTypes.layer' },
  { value: 'turkey', emoji: '🦃', key: 'entityTypes.turkey' },
  { value: 'duck', emoji: '🦆', key: 'entityTypes.duck' },
  { value: 'other', emoji: '🐾', key: 'entityTypes.other' },
] as const;

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    name: string;
    entityType: string;
    breed: string;
    initialQuantity: number;
    startDate: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function CreateGroupModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: Readonly<CreateGroupModalProps>) {
  const t = useTranslations('groups');
  const tc = useTranslations('common');

  const ENTITY_TYPES = ENTITY_TYPE_KEYS.map((et) => ({
    ...et,
    label: t(et.key),
  }));

  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [breed, setBreed] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!open) return null;

  function resetForm() {
    setName('');
    setEntityType('');
    setBreed('');
    setInitialQuantity('');
    setStartDate('');
    setSubmitError(null);
  }

  async function handleSubmit() {
    const quantity = Number(initialQuantity);

    if (
      !name.trim() ||
      !entityType ||
      !breed.trim() ||
      !startDate ||
      Number.isNaN(quantity)
    ) {
      setSubmitError(t('fillRequiredFields'));
      return;
    }

    if (quantity <= 0) {
      setSubmitError(t('initialQuantityPositive'));
      return;
    }

    setSubmitError(null);

    try {
      await onSubmit?.({
        name: name.trim(),
        entityType,
        breed: breed.trim(),
        initialQuantity: quantity,
        startDate,
      });
      resetForm();
      onClose();
    } catch {
      setSubmitError(t('createGroupError'));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) {
            resetForm();
            onClose();
          }
        }}
        onKeyDown={(event) => {
          if (
            !isSubmitting &&
            (event.key === 'Enter' || event.key === ' ')
          ) {
            resetForm();
            onClose();
          }
        }}
        aria-label={tc('close')}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[540px] rounded-2xl overflow-hidden page-enter"
        style={{
          boxShadow:
            '0 24px 48px rgba(15,14,12,0.20), 0 4px 12px rgba(15,14,12,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{
            background: 'linear-gradient(135deg, #0D2818 0%, #1B4332 100%)',
          }}
        >
          <div>
            <h2 className="font-display text-[20px] text-white font-semibold">
              {t('newGroup')}
            </h2>
            <p className="text-[13px] text-white/60 mt-0.5">
              {t('newGroupDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isSubmitting) {
                resetForm();
                onClose();
              }
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Group Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-group-name"
              className="text-[13px] font-semibold"
              style={{ color: '#2C2A24' }}
            >
              {t('groupName')} <span style={{ color: '#E76F51' }}>*</span>
            </label>
            <input
              id="create-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('groupNamePlaceholder')}
              disabled={isSubmitting}
              className="w-full h-11 px-4 rounded-xl text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#2D6A4F]/20 disabled:opacity-50"
              style={{
                backgroundColor: '#FAFAF8',
                border: '1.5px solid #E4E0D8',
                color: '#2C2A24',
              }}
            />
          </div>

          {/* Entity Type — Icon Grid */}
          <div className="space-y-1.5">
            <p
              className="text-[13px] font-semibold"
              style={{ color: '#2C2A24' }}
            >
              {t('groupType')} <span style={{ color: '#E76F51' }}>*</span>
            </p>
            <div className="grid grid-cols-5 gap-2">
              {ENTITY_TYPES.map((et) => {
                const isSelected = entityType === et.value;
                return (
                  <button
                    key={et.value}
                    type="button"
                    onClick={() => setEntityType(et.value)}
                    disabled={isSubmitting}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all text-center disabled:opacity-50"
                    style={{
                      backgroundColor: isSelected ? '#D8F3DC' : '#FAFAF8',
                      border: isSelected
                        ? '2px solid #2D6A4F'
                        : '1.5px solid #E4E0D8',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                    }}
                  >
                    <span className="text-[24px]">{et.emoji}</span>
                    <span
                      className="text-[10px] font-semibold leading-tight"
                      style={{ color: isSelected ? '#0D2818' : '#5C5852' }}
                    >
                      {et.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Breed */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-group-breed"
              className="text-[13px] font-semibold"
              style={{ color: '#2C2A24' }}
            >
              {t('breedLabel')} <span style={{ color: '#E76F51' }}>*</span>
            </label>
            <input
              id="create-group-breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder={t('breedPlaceholder')}
              disabled={isSubmitting}
              className="w-full h-11 px-4 rounded-xl text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#2D6A4F]/20 disabled:opacity-50"
              style={{
                backgroundColor: '#FAFAF8',
                border: '1.5px solid #E4E0D8',
                color: '#2C2A24',
              }}
            />
          </div>

          {/* Quantity and Date Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Initial Quantity */}
            <div className="space-y-1.5">
              <label
                htmlFor="create-group-initial-quantity"
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('initialQuantity')} <span style={{ color: '#E76F51' }}>*</span>
              </label>
              <input
                id="create-group-initial-quantity"
                type="number"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                placeholder="0"
                disabled={isSubmitting}
                className="w-full h-11 px-4 rounded-xl text-[14px] font-mono outline-none transition-all focus:ring-2 focus:ring-[#2D6A4F]/20 disabled:opacity-50"
                style={{
                  backgroundColor: '#FAFAF8',
                  border: '1.5px solid #E4E0D8',
                  color: '#2C2A24',
                }}
                dir="ltr"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="create-group-start-date"
                className="text-[13px] font-semibold"
                style={{ color: '#2C2A24' }}
              >
                {t('startDate')} <span style={{ color: '#E76F51' }}>*</span>
              </label>
              <input
                id="create-group-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-11 px-4 rounded-xl text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#2D6A4F]/20 disabled:opacity-50"
                style={{
                  backgroundColor: '#FAFAF8',
                  border: '1.5px solid #E4E0D8',
                  color: '#2C2A24',
                }}
                dir="ltr"
              />
            </div>
          </div>

          {submitError && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
              }}
            >
              {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ backgroundColor: '#FAFAF8', borderTop: '1px solid #F0EDE4' }}
        >
          <button
            type="button"
            onClick={() => {
              if (!isSubmitting) {
                resetForm();
                onClose();
              }
            }}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-[14px] font-medium cursor-pointer transition-colors hover:bg-[#F0EDE4] disabled:opacity-50"
            style={{ color: '#5C5852' }}
          >
            {tc('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-white text-[14px] font-semibold cursor-pointer transition-all hover:brightness-110 disabled:opacity-60"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {isSubmitting ? tc('saving') : t('createGroup')}
          </button>
        </div>
      </div>
    </div>
  );
}
