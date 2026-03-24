import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { queryKeys } from '@/lib/hooks/api/query-keys';

export function useInvitation(token: string | null) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const response = await api.get(`/invitations/${token}`);
      return response.data;
    },
    enabled: Boolean(token),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post(`/invitations/${token}/accept`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.all() });
    },
  });
}
