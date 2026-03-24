import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';

type ListMembersParams = {
  page?: number;
  limit?: number;
  status?: 'pending' | 'active' | 'inactive';
};

export type MemberStatus = 'pending' | 'active' | 'inactive';

export type MemberRow = {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  status?: MemberStatus;
  joinedAt?: string;
  joinDate?: string;
};

export type ListMembersResponse = {
  members?: MemberRow[];
  total?: number;
  page?: number;
  limit?: number;
};

export function useMembers(params?: ListMembersParams) {
  const { farmId } = useFarmContext();
  const normalizedParams = {
    ...params,
    limit:
      typeof params?.limit === 'number'
        ? Math.min(100, Math.max(1, params.limit))
        : params?.limit,
  };

  return useQuery({
    queryKey: [...queryKeys.members.all(farmId ?? ''), normalizedParams],
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}/members`, {
        params: normalizedParams,
      });
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

type InviteMemberPayload = {
  email: string;
  role: 'OWNER' | 'WORKER';
};

export function useInviteMember() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InviteMemberPayload) => {
      const response = await api.post(`/farms/${farmId}/invite`, payload);
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.all(farmId),
      });
    },
  });
}

type DeactivateMemberPayload = {
  userId: string;
  isActive: boolean;
};

export function useDeactivateMember() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: DeactivateMemberPayload) => {
      const response = await api.patch(`/farms/${farmId}/members/${userId}`, {
        status: isActive ? 'active' : 'inactive',
      });
      return response.data;
    },
    onSuccess: () => {
      if (!farmId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.all(farmId),
      });
    },
  });
}

export function useInvitationDetails(token: string | null) {
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

export type UserInvitationRow = {
  id: string;
  token: string;
  farmId: string;
  farmName?: string;
  role?: string;
  status?: string;
  inviterId?: string;
  inviterName?: string;
  email?: string;
  expiresAt?: string;
  createdAt?: string;
};

export type ListUserInvitationsResponse = {
  invitations?: UserInvitationRow[];
};

export function useMyInvitations() {
  return useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const response =
        await api.get<ListUserInvitationsResponse>('/invitations/my');
      return response.data;
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post(`/invitations/${token}/reject`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
    },
  });
}
