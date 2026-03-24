import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type StockListFilters = {
  page?: number;
  offset?: number;
  limit?: number;
  category?: string;
  low_stock_only?: boolean;
};

type StockTransactionsFilters = {
  page?: number;
  offset?: number;
  limit?: number;
  material_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  // Legacy aliases kept for compatibility with any existing callers.
  from_date?: string;
  to_date?: string;
};

type StockAnalyticsFilters = {
  period?: 'day' | 'week' | 'month' | 'year';
};

export function useStockMaterials(filters?: StockListFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.stock.materials(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const offset =
        typeof filters?.offset === 'number'
          ? filters.offset
          : typeof filters?.page === 'number' && filters.page > 0
            ? (filters.page - 1) * (filters.limit ?? 10)
            : undefined;

      const response = await api.get('/stock/materials', {
        params: {
          farm_id: farmId,
          ...filters,
          offset,
        },
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

// Compatibility alias for worker-space checklist naming.
export function useMaterials(filters?: StockListFilters) {
  return useStockMaterials(filters);
}

export function useStockTransactions(filters?: StockTransactionsFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.stock.transactions(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const offset =
        typeof filters?.offset === 'number'
          ? filters.offset
          : typeof filters?.page === 'number' && filters.page > 0
            ? (filters.page - 1) * (filters.limit ?? 10)
            : undefined;

      const response = await api.get('/stock/transactions', {
        params: {
          farm_id: farmId,
          ...filters,
          start_date: filters?.start_date ?? filters?.from_date,
          end_date: filters?.end_date ?? filters?.to_date,
          offset,
        },
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useStockAlerts() {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: queryKeys.stock.alerts(farmId ?? ''),
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/stock/alerts`);
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useStockAlertsCount() {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: queryKeys.stock.alertsCount(farmId ?? ''),
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/stock/alerts/count`);
      return response.data;
    },
    enabled: Boolean(farmId),
    staleTime: 1000 * 60,
  });
}

// Compatibility alias for worker-space checklist naming.
export function useStockAlertCount() {
  return useStockAlertsCount();
}

export function useStockAnalytics(filters?: StockAnalyticsFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.stock.analytics(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get('/stock/analytics', {
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

export function useCreateStockMaterial() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post('/stock/materials', payload, {
        params: { farm_id: farmId },
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.materials(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alerts(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alertsCount(farmId),
      });
    },
  });
}

type UpdateStockMaterialPayload = {
  id: string;
  data: Record<string, unknown>;
};

export function useUpdateStockMaterial() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateStockMaterialPayload) => {
      const response = await api.put(`/stock/materials/${id}`, data, {
        params: { farm_id: farmId },
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.materials(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alerts(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alertsCount(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.analytics(farmId),
      });
    },
  });
}

export function useCreateStockTransaction() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post('/stock/transactions', payload, {
        params: { farm_id: farmId },
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.materials(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.transactions(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alerts(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alertsCount(farmId),
      });
    },
  });
}

type UpdateStockTransactionPayload = {
  id: string;
  data: Record<string, unknown>;
  method?: 'PUT' | 'PATCH';
};

export function useUpdateStockTransaction() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      method = 'PATCH',
    }: UpdateStockTransactionPayload) => {
      const opts = { params: { farm_id: farmId } };
      const response =
        method === 'PUT'
          ? await api.put(`/stock/transactions/${id}`, data, opts)
          : await api.patch(`/stock/transactions/${id}`, data, opts);

      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.materials(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.transactions(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alerts(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.alertsCount(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stock.analytics(farmId),
      });
    },
  });
}
