import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { queryKeys } from '@/lib/hooks/api/query-keys';
import { useWorkerDashboard } from '@/lib/hooks/api/use-worker-dashboard';

export type DashboardTaskOccurrence = {
  id: string;
  title?: string;
  scheduledDate?: string;
  timeOfDay?: string;
  status?: string;
};

export type DashboardPeriod = 'day' | 'week' | 'month' | 'year';

export type OwnerDashboardResponse = {
  period: DashboardPeriod;
  range: {
    startDate: string;
    endDate: string;
  };
  totalTasks: number;
  taskSummary: {
    total: number;
    todo: number;
    pending: number;
    completed: number;
    skipped: number;
    completionRate: number;
  };
  recentTasks: DashboardTaskOccurrence[];
  reportsSummary: {
    total: number;
    resolved: number;
    open: number;
  };
  lowStockAlertsCount: number;
  totalWorkers: number;
  totalActiveTemplates: number;
};

export function useDashboard(period: DashboardPeriod = 'week') {
  const { isOwner } = useFarmContext();
  const ownerResult = useOwnerDashboard(period, isOwner);
  const workerResult = useWorkerDashboard(!isOwner);

  return isOwner ? ownerResult : workerResult;
}

export function useOwnerDashboard(period: DashboardPeriod = 'week', enabled = true) {
  const { farmId } = useFarmContext();

  return useQuery<OwnerDashboardResponse>({
    queryKey: queryKeys.dashboard.owner(farmId ?? '', period),
    queryFn: async () => {
      const response = await api.get<OwnerDashboardResponse>(
        `/farms/${farmId}/dashboard/owner`,
        {
          params: { period },
        },
      );
      return response.data;
    },
    enabled: Boolean(farmId) && enabled,
    staleTime: 1000 * 60 * 5,
  });
}
