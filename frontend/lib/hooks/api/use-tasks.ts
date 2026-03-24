import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type TaskTemplateFilters = {
  page?: number;
  limit?: number;
  isActive?: string;
  recurrence?: string;
};

export function useTaskTemplates(filters?: TaskTemplateFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.tasks.templates(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/task-templates`, {
        params: filters,
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

export function useTaskTemplate(templateId: string | null) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.tasks.templates(farmId ?? ''), templateId ?? ''],
    queryFn: async () => {
      const response = await api.get(
        `/farms/${farmId}/task-templates/${templateId}`,
      );
      return response.data;
    },
    enabled: Boolean(farmId && templateId),
  });
}

export function useCreateTaskTemplate() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post(
        `/farms/${farmId}/task-templates`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.templates(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
    },
  });
}

type DeleteTaskTemplatePayload = {
  id: string;
};

export function useDeleteTaskTemplate() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteTaskTemplatePayload) => {
      const response = await api.delete(
        `/farms/${farmId}/task-templates/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.templates(farmId),
      });
    },
  });
}

export function useUpdateTaskTemplate() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const response = await api.patch(
        `/farms/${farmId}/task-templates/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.templates(farmId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.templates(farmId), variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.occurrences.all(farmId),
      });
    },
  });
}

export function useUpdateTaskTemplateStatus() {
  const updateTemplate = useUpdateTaskTemplate();

  return useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      // Backend expects status field or isActive
      return updateTemplate.mutateAsync({
        id,
        data: { isActive },
      });
    },
  });
}
