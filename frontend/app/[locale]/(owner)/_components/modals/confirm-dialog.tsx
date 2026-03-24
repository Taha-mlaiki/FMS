'use client';

import { useTranslations } from 'next-intl';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useMockActionFeedback } from '@/lib/hooks/use-mock-action-feedback';

/* ── D8 — Confirm Dialog (Reusable) ── */

type ConfirmVariant = 'danger' | 'warning' | 'default';

const variantConfig: Record<
  ConfirmVariant,
  { icon: React.ReactNode; btnBg: string; btnLabel?: string }
> = {
  danger: {
    icon: <Trash2 className="w-10 h-10" style={{ color: '#E76F51' }} />,
    btnBg: '#E76F51',
  },
  warning: {
    icon: <AlertTriangle className="w-10 h-10" style={{ color: '#F4A261' }} />,
    btnBg: '#F4A261',
  },
  default: {
    icon: <AlertTriangle className="w-10 h-10" style={{ color: '#2D6A4F' }} />,
    btnBg: '#2D6A4F',
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: ConfirmVariant;
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  variant = 'danger',
  isPending,
}: ConfirmDialogProps) {
  const t = useTranslations('common');
  const resolvedConfirmLabel = confirmLabel ?? t('confirm');
  const { runMockAction, pendingActions } = useMockActionFeedback();
  const isConfirming = !!isPending || !!pendingActions['confirm-dialog'];
  const config = variantConfig[variant];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-[400px] rounded-[24px] overflow-hidden page-enter"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 cursor-pointer"
          style={{ color: '#9C9890' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Body */}
        <div className="px-8 pt-8 pb-6 text-center space-y-4">
          <div className="flex justify-center">{config.icon}</div>
          <h2 className="font-display text-[22px]" style={{ color: '#2C2A24' }}>
            {title}
          </h2>
          <p className="text-[15px]" style={{ color: '#5C5852' }}>
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[10px] text-[14px] font-medium cursor-pointer"
            style={{ color: '#5C5852', border: '1px solid #E4E0D8' }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={async () => {
              const ok = await runMockAction({
                actionKey: 'confirm-dialog',
                successTitle: t('actionSuccess'),
                successDescription: title,
                errorTitle: t('actionError'),
                errorDescription: description,
              });
              if (ok) {
                onConfirm();
                onClose();
              }
            }}
            disabled={isConfirming}
            className="px-5 py-2.5 rounded-[10px] text-white text-[14px] font-semibold cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: config.btnBg }}
          >
            {isConfirming ? '...' : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
