import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DashboardPeriod = 'day' | 'week' | 'month' | 'year';
export type TaskViewMode = 'list' | 'calendar';

interface PreferencesState {
  lastActiveFarmId: string | null;
  dashboardPeriod: DashboardPeriod;
  taskViewMode: TaskViewMode;
  setLastActiveFarmId: (farmId: string | null) => void;
  setDashboardPeriod: (period: DashboardPeriod) => void;
  setTaskViewMode: (mode: TaskViewMode) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      lastActiveFarmId: null,
      dashboardPeriod: 'week',
      taskViewMode: 'list',
      setLastActiveFarmId: (farmId) => set({ lastActiveFarmId: farmId }),
      setDashboardPeriod: (period) => set({ dashboardPeriod: period }),
      setTaskViewMode: (mode) => set({ taskViewMode: mode }),
    }),
    { name: 'fms-preferences' },
  ),
);
