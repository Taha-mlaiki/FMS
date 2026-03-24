import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getMe, type ProfileResponse } from '@/lib/api/auth';
import { queryKeys } from '@/lib/hooks/api/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';

export { useLogin, useLogout, useRegister } from '@/lib/hooks/use-auth';

export function useAuthProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: getMe,
    enabled,
  });
}

export function useCheckEmailAvailability() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.get<{ available: boolean }>(
        '/auth/check-email',
        {
          params: { email },
        },
      );
      return response.data;
    },
  });
}

type UpdateProfilePayload = {
  full_name?: string;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await api.patch<ProfileResponse>('/auth/me', payload);
      return response.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.auth.profile(), updatedProfile);

      const existingUser = useAuthStore.getState().user;
      useAuthStore.getState().setUser({
        ...(existingUser ?? {}),
        ...updatedProfile,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
  });
}

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const response = await api.post('/auth/change-password', {
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      });
      return response.data;
    },
  });
}
