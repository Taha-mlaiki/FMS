import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type WorkerFilters = {
  status?: 'pending' | 'active' | 'inactive';
  page?: number;
  limit?: number;
};

export type WorkerStatus = 'pending' | 'active' | 'inactive';

export type WorkerRow = {
  id?: string;
  userId?: string;
  user_id?: string;
  email?: string;
  fullName?: string;
  full_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  status?: WorkerStatus;
  joinedAt?: string;
  join_date?: string;
  isActive?: boolean;
  is_active?: boolean;
};

export type ListWorkersResponse = {
  members?: WorkerRow[];
  total?: number;
  page?: number;
  limit?: number;
};

// For backward compatibility
export type MemberStatus = WorkerStatus;
export type MemberRow = WorkerRow;
export type ListMembersResponse = ListWorkersResponse;

export function useWorkers(filters?: WorkerFilters) {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: [...queryKeys.workers.all(farmId ?? ''), filters ?? {}],
    queryFn: async () => {
      const response = await api.get('/production/workers', {
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

export function useCreateWorkerInvitation() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await api.post(`/farms/${farmId}/invite`, {
        ...payload,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workers.all(farmId ?? ''),
      });
    },
  });
}

// Backward compatibility alias
export const useMembers = useWorkers;
export const useInviteMember = useCreateWorkerInvitation;
