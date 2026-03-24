import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { createFarm, listFarms, type CreateFarmPayload } from '@/lib/api/farm';
import { queryKeys } from '@/lib/hooks/api/query-keys';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePreferencesStore } from '@/lib/stores/preferences.store';
import { useFarmContext } from '@/lib/hooks/use-farm-context';

const FARM_SCOPED_ROOTS = new Set([
  'members',
  'groups',
  'tasks',
  'occurrences',
  'metrics',
  'stock',
  'reports',
  'dashboard',
]);

export function useFarms(enabled = true) {
  return useQuery({
    queryKey: queryKeys.farms.all(),
    queryFn: listFarms,
    enabled,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFarmPayload) => createFarm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.all() });
    },
  });
}

export function useFarmDetails() {
  const { farmId } = useFarmContext();

  return useQuery({
    queryKey: queryKeys.farms.detail(farmId ?? ''),
    queryFn: async () => {
      const response = await api.get(`/farms/${farmId}`);
      return response.data;
    },
    enabled: Boolean(farmId),
  });
}

type UpdateFarmPayload = {
  name?: string;
  location?: string;
};

export function useUpdateFarm() {
  const { farmId } = useFarmContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateFarmPayload) => {
      const response = await api.patch(`/farms/${farmId}`, payload);
      return response.data;
    },
    onSuccess: (updatedFarm) => {
      if (!farmId) return;

      const authState = useAuthStore.getState();
      const mergedFarms = authState.farms.map((farm) => {
        if (farm.id !== farmId) return farm;

        return {
          ...farm,
          name:
            (updatedFarm as { name?: string } | undefined)?.name ?? farm.name,
        };
      });

      authState.setFarms(mergedFarms);

      queryClient.invalidateQueries({ queryKey: queryKeys.farms.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.farms.detail(farmId),
      });
    },
  });
}

export function useSwitchFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (farmId: string) => farmId,
    onSuccess: (farmId) => {
      const farms = useAuthStore.getState().farms;
      const farm = farms.find((item) => item.id === farmId);
      if (!farm) return;

      useAuthStore.getState().setActiveFarm(farmId, farm.role);
      usePreferencesStore.getState().setLastActiveFarmId(farmId);

      queryClient.removeQueries({
        predicate: (query) => {
          if (!Array.isArray(query.queryKey)) return false;
          const root = String(query.queryKey[0] ?? '');
          const keyFarmId = query.queryKey[1];
          return FARM_SCOPED_ROOTS.has(root) && keyFarmId !== farmId;
        },
      });

      queryClient.invalidateQueries({
        predicate: (query) => {
          if (!Array.isArray(query.queryKey)) return false;
          const root = String(query.queryKey[0] ?? '');
          const keyFarmId = query.queryKey[1];
          return FARM_SCOPED_ROOTS.has(root) && keyFarmId === farmId;
        },
      });
    },
  });
}
