import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { queryKeys } from '@/lib/hooks/api/query-keys';
import { useFarmContext } from '@/lib/hooks/use-farm-context';

export type WorkerDashboardOccurrence = {
  id: string;
  title?: string;
  scheduledDate?: string;
  timeOfDay?: string;
  status?: string;
};

export type WorkerDashboardResponse = {
  todayTasks: WorkerDashboardOccurrence[];
  recentCompletions: WorkerDashboardOccurrence[];
  myReportsCount: number;
  totalCompletedTasks: number;
  totalSkippedTasks: number;
  totalTasks: number;
  myFarmsCount: number;
};

export function useWorkerDashboard(enabled = true) {
  const { farmId } = useFarmContext();

  return useQuery<WorkerDashboardResponse>({
    queryKey: queryKeys.dashboard.worker(farmId ?? ''),
    queryFn: async () => {
      const response = await api.get<WorkerDashboardResponse>(
        `/farms/${farmId}/dashboard/worker`,
      );
      return response.data;
    },
    enabled: Boolean(farmId) && enabled,
    staleTime: 1000 * 60 * 5,
  });
}
