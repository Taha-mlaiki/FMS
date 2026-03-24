import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type MetricsFilters = {
  groupId?: string;
  period?: 'day' | 'week' | 'month' | 'year';
  metricName?: string;
};

export function useMetrics(filters?: MetricsFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.metrics.all(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/metrics`, {
        params: filters,
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useRecordMetric() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post('/production/metrics', {
        ...payload,
        farm_id: farmId,
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.worker(farmId),
      });
    },
  });
}

type MetricTypesFilters = {
  page?: number;
  limit?: number;
};

type UpsertMetricTypePayload = {
  name: string;
  unit: string;
  data_type: 'NUMBER' | 'DECIMAL';
};

export function useMetricTypes(filters?: MetricTypesFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.metrics.types(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/metric-types`, {
        params: filters,
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useCreateMetricType() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpsertMetricTypePayload) => {
      const response = await api.post(`/farms/${farmId}/metric-types`, payload);
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.types(farmId),
      });
    },
  });
}

export function useUpdateMetricType() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<UpsertMetricTypePayload>;
    }) => {
      const response = await api.patch(
        `/farms/${farmId}/metric-types/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.types(farmId),
      });
    },
  });
}

export function useDeleteMetricType() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/farms/${farmId}/metric-types/${id}`);
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics.types(farmId),
      });
    },
  });
}
