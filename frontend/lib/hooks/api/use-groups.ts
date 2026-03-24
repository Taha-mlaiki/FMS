import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type GroupFilters = {
  status?: string;
  page?: number;
  limit?: number;
};

export function useGroups(filters?: GroupFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.groups.all(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get('/production/groups', {
        params: {
          farmId: farmId,
          ...filters,
        },
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useGroup(groupId: string | null) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: queryKeys.groups.detail(farmId ?? '', groupId ?? ''),
    queryFn: async () => {
      const response = await api.get(`/production/groups/${groupId}`, {
        params: { farmId: farmId },
      });
      return response.data;
    },
    enabled: Boolean(farmId && groupId),
  });
}

export function useCreateGroup() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post('/production/groups', {
        ...payload,
        farmId: farmId,
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(farmId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.worker(farmId),
      });
    },
  });
}

type UpdateGroupPayload = {
  id: string;
  data: Record<string, unknown>;
};

export function useUpdateGroup() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateGroupPayload) => {
      const response = await api.put(`/production/groups/${id}`, data, {
        params: { farmId: farmId },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (!farmId) return;

      // Keep the detail page in sync immediately after a successful update.
      queryClient.setQueryData(
        queryKeys.groups.detail(farmId, variables.id),
        data,
      );

      // Also patch matching items in any cached group lists to avoid stale rows.
      queryClient.setQueriesData(
        { queryKey: queryKeys.groups.all(farmId) },
        (previous: unknown) => {
          if (!previous || typeof previous !== 'object') return previous;

          const source = previous as {
            groups?: Array<Record<string, unknown>>;
          };

          if (!Array.isArray(source.groups)) return previous;

          const nextGroups = source.groups.map((group) => {
            if (group?.id !== variables.id) return group;

            if (data && typeof data === 'object') {
              return {
                ...group,
                ...(data as Record<string, unknown>),
              };
            }

            return group;
          });

          return {
            ...(previous as Record<string, unknown>),
            groups: nextGroups,
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(farmId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(farmId, variables.id),
      });
    },
  });
}

export function useDeleteGroup() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await api.delete(`/production/groups/${groupId}`, {
        params: { farmId: farmId },
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(farmId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.all(farmId),
      });
    },
  });
}
