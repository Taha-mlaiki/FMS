'use client';

import { toast } from 'sonner';
import { useUiStore } from '@/lib/stores/ui.store';

interface RunMockActionOptions {
  actionKey: string;
  successTitle: string;
  successDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  forceResult?: 'success' | 'error';
  delayMs?: number;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useMockActionFeedback() {
  const pendingActions = useUiStore((state) => state.pendingActions);
  const setPendingAction = useUiStore((state) => state.setPendingAction);

  const runMockAction = async ({
    actionKey,
    successTitle,
    successDescription,
    errorTitle = 'حدث خطأ أثناء تنفيذ العملية',
    errorDescription = 'يرجى المحاولة مرة أخرى.',
    forceResult,
    delayMs = 700,
    onSuccess,
    onError,
  }: RunMockActionOptions) => {
    if (pendingActions[actionKey]) {
      return false;
    }

    setPendingAction(actionKey, true);

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const isSuccess =
      forceResult === 'success'
        ? true
        : forceResult === 'error'
          ? false
          : Math.random() >= 0.2;

    setPendingAction(actionKey, false);

    if (isSuccess) {
      toast.success(successTitle, {
        description: successDescription,
      });
      onSuccess?.();
      return true;
    }

    toast.error(errorTitle, {
      description: errorDescription,
    });
    onError?.();
    return false;
  };

  return {
    runMockAction,
    pendingActions,
  };
}
