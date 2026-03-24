'use client';
import { useTranslations } from 'next-intl';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ConfirmVariant = 'default' | 'danger' | 'warning';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel: externalConfirmLabel,
  cancelLabel: externalCancelLabel,
  confirmVariant = 'default',
  isLoading = false,
  onOpenChange,
  onConfirm,
}: Readonly<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmVariant;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}>) {
  const t = useTranslations('common');
  const confirmLabel = externalConfirmLabel || t('confirm');
  const cancelLabel = externalCancelLabel || t('cancel');

  const confirmButtonClassName =
    confirmVariant === 'danger'
      ? 'bg-[#E76F51] text-white hover:bg-[#d55f45]'
      : confirmVariant === 'warning'
        ? 'bg-[#F4A261] text-white hover:bg-[#e1924f]'
        : 'bg-[#2D6A4F] text-white hover:bg-[#24563f]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className={confirmButtonClassName}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
