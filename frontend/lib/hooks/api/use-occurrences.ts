import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type OccurrenceFilters = {
  page?: number;
  limit?: number;
  status?: string;
  workerId?: string;
  groupId?: string;
  startDate?: string;
  endDate?: string;
  recurrence?: string;
  // snake_case aliases used by some callers
  group_id?: string;
  start_date?: string;
  end_date?: string;
};

type TaskCountFilters = {
  status?: string;
  workerId?: string;
};

export function useOccurrences(filters?: OccurrenceFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.occurrences.all(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/tasks`, {
        params: filters,
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useWorkerTasks(filters?: OccurrenceFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.occurrences.all(farmId ?? ''), 'worker-tasks', filters ?? {}],
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/tasks/worker-tasks`, {
        params: filters,
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useOccurrence(occurrenceId: string | null) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: queryKeys.occurrences.detail(farmId ?? '', occurrenceId ?? ''),
    queryFn: async () => {
      const response = await api.get(
        `/farms/${farmId}/tasks/${occurrenceId}`,
      );
      return response.data;
    },
    enabled: Boolean(farmId && occurrenceId),
  });
}

export function useGenerateOccurrences() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post(
        `/farms/${farmId}/tasks/occurrences/generate`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.count(farmId),
      });
    },
  });
}

type CompleteOccurrencePayload = {
  id: string;
  data?: Record<string, unknown>;
};

type SkipOccurrencePayload = {
  id: string;
  data?: Record<string, unknown>;
};

function updateOccurrenceStatusInPayload(
  payload: unknown,
  occurrenceId: string,
  nextStatus: 'completed' | 'skipped',
) {
  if (!payload || typeof payload !== 'object') return payload;

  const source = payload as Record<string, unknown>;

  if (Array.isArray(source.occurrences)) {
    return {
      ...source,
      occurrences: source.occurrences.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const row = item as Record<string, unknown>;
        return row.id === occurrenceId ? { ...row, status: nextStatus } : row;
      }),
    };
  }

  if (Array.isArray(source.data)) {
    return {
      ...source,
      data: source.data.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const row = item as Record<string, unknown>;
        return row.id === occurrenceId ? { ...row, status: nextStatus } : row;
      }),
    };
  }

  if (source.id === occurrenceId) {
    return { ...source, status: nextStatus };
  }

  if (
    typeof source.occurrence === 'object' &&
    source.occurrence !== null &&
    (source.occurrence as Record<string, unknown>).id === occurrenceId
  ) {
    return {
      ...source,
      occurrence: {
        ...(source.occurrence as Record<string, unknown>),
        status: nextStatus,
      },
    };
  }

  return payload;
}

export function useCompleteOccurrence() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: CompleteOccurrencePayload) => {
      const response = await api.post(
        `/farms/${farmId}/tasks/${id}/complete`,
        data,
      );
      return response.data;
    },
    onMutate: async ({ id }) => {
      if (!farmId) return {};

      await queryClient.cancelQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.occurrences.detail(farmId, id),
      });

      const previousDetail = queryClient.getQueryData(
        queryKeys.occurrences.detail(farmId, id),
      );

      const previousLists = queryClient.getQueriesData({
        queryKey: queryKeys.occurrences.all(farmId),
      });

      queryClient.setQueryData(
        queryKeys.occurrences.detail(farmId, id),
        (old) => updateOccurrenceStatusInPayload(old, id, 'completed'),
      );

      queryClient.setQueriesData(
        { queryKey: queryKeys.occurrences.all(farmId) },
        (old) => updateOccurrenceStatusInPayload(old, id, 'completed'),
      );

      return { previousDetail, previousLists };
    },
    onError: (_error, variables, context) => {
      if (!farmId) return;

      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(
          queryKeys.occurrences.detail(farmId, variables.id),
          context.previousDetail,
        );
      }

      context?.previousLists?.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: (_data, variables) => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.detail(farmId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.count(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.worker(farmId),
      });
      // Completing a task creates a report and may affect stock
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.analytics(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.materials(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.analytics(farmId),
      });
    },
  });
}

export function useSkipOccurrence() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: SkipOccurrencePayload) => {
      const response = await api.post(
        `/farms/${farmId}/tasks/${id}/skip`,
        data,
      );
      return response.data;
    },
    onMutate: async ({ id }) => {
      if (!farmId) return {};

      await queryClient.cancelQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.occurrences.detail(farmId, id),
      });

      const previousDetail = queryClient.getQueryData(
        queryKeys.occurrences.detail(farmId, id),
      );

      const previousLists = queryClient.getQueriesData({
        queryKey: queryKeys.occurrences.all(farmId),
      });

      queryClient.setQueryData(
        queryKeys.occurrences.detail(farmId, id),
        (old) => updateOccurrenceStatusInPayload(old, id, 'skipped'),
      );

      queryClient.setQueriesData(
        { queryKey: queryKeys.occurrences.all(farmId) },
        (old) => updateOccurrenceStatusInPayload(old, id, 'skipped'),
      );

      return { previousDetail, previousLists };
    },
    onError: (_error, variables, context) => {
      if (!farmId) return;

      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(
          queryKeys.occurrences.detail(farmId, variables.id),
          context.previousDetail,
        );
      }

      context?.previousLists?.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSuccess: (_data, variables) => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.detail(farmId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.count(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.worker(farmId),
      });
    },
  });
}

export function useCreateOccurrence() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post(
        `/farms/${farmId}/tasks`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.count(farmId),
      });
    },
  });
}

export function useUpdateOccurrence() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.patch(
        `/farms/${farmId}/tasks/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.detail(farmId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.count(farmId),
      });
    },
  });
}

export function useDeleteOccurrence() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await api.delete(
        `/farms/${farmId}/tasks/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.count(farmId),
      });
    },
  });
}

export function useTaskCount(filters?: TaskCountFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [queryKeys.occurrences.count(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/tasks/count`, {
        params: filters,
      });
      return response.data;
    },
    enabled: Boolean(farmId),
    staleTime: 1000 * 60,
  });
}

export function useOccurrenceCount() {
  return useTaskCount();
}
