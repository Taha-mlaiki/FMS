import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import {
  createFarm,
  createGroup,
  type CreateFarmPayload,
  type CreateGroupPayload,
} from '@/lib/api/farm';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
    return `Request failed (${error.response?.status || 'unknown'})`;
  }
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

export function useCreateFarm() {
  return useMutation({
    mutationFn: (data: CreateFarmPayload) => createFarm(data),
    onSuccess: () => {
      toast.success('تم إنشاء المزرعة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل إنشاء المزرعة', {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: (data: CreateGroupPayload) => createGroup(data),
    onSuccess: () => {
      toast.success('تم إنشاء المجموعة بنجاح');
    },
    onError: (error) => {
      toast.error('فشل إنشاء المجموعة', {
        description: getErrorMessage(error),
      });
    },
  });
}
