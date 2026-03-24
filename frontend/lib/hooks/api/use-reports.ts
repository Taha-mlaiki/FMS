import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type ReportFilters = {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  severity?: string;
  task_id?: string;
  group_id?: string;
  group_ids?: string[];
  created_by?: string;
  startDate?: string;
  endDate?: string;
};

type ReportAnalyticsFilters = {
  period?: 'day' | 'week' | 'month' | 'year';
};

export function useReports(filters?: ReportFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.reports.all(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get('/reports', {
        params: {
          farm_id: farmId,
          ...filters,
        },
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useReport(reportId: string | null) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: queryKeys.reports.detail(farmId ?? '', reportId ?? ''),
    queryFn: async () => {
      const response = await api.get(`/reports/${reportId}`, {
        params: { farm_id: farmId },
      });
      return response.data;
    },
    enabled: Boolean(farmId && reportId),
  });
}

export function useReportAnalytics(filters?: ReportAnalyticsFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.reports.analytics(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get('/reports/analytics', {
        params: {
          farm_id: farmId,
          ...filters,
        },
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useCreateReport() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post('/reports', payload, {
        params: { farm_id: farmId },
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.analytics(farmId),
      });
    },
  });
}

type UpdateReportPayload = {
  id: string;
  data: Record<string, unknown>;
};

export function useUpdateReport() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateReportPayload) => {
      const response = await api.put(`/reports/${id}`, data, {
        params: { farm_id: farmId },
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.detail(farmId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.analytics(farmId),
      });
    },
  });
}

export function useDeleteReport() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/reports/${id}`, {
        params: { farm_id: farmId },
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.analytics(farmId),
      });
    },
  });
}

function useReportAction(endpointSuffix: string) {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data?: Record<string, unknown>;
    }) => {
      const response = await api.post(
        `/reports/${id}/${endpointSuffix}`,
        data ?? {},
        {
          params: { farm_id: farmId },
        },
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.detail(farmId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.analytics(farmId),
      });
    },
  });
}

export function useSubmitReport() {
  return useReportAction('submit');
}

export function useReviewReport() {
  return useReportAction('review');
}

export function useResolveReport() {
  return useReportAction('resolve');
}
