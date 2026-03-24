import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

export interface TaskCategory {
  id: string;
  farm_id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useTaskCategories() {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: queryKeys.tasks.categories(farmId ?? ''),
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/task-categories`);
      return response.data as { categories: TaskCategory[] };
    },
    enabled: Boolean(farmId),
  });
}

export function useCreateTaskCategory() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; color?: string }) => {
      const response = await api.post(
        `/farms/${farmId}/task-categories`,
        payload,
      );
      return response.data as TaskCategory;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.categories(farmId),
      });
    },
  });
}

export function useDeleteTaskCategory() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await api.delete(
        `/farms/${farmId}/task-categories/${categoryId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.categories(farmId),
      });
    },
  });
}
