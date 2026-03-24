import { create } from 'zustand';

type PendingActions = Record<string, boolean>;

interface UiStore {
  isSidebarCollapsed: boolean;
  pendingActions: PendingActions;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPendingAction: (actionKey: string, pending: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isSidebarCollapsed: false,
  pendingActions: {},
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setPendingAction: (actionKey, pending) =>
    set((state) => ({
      pendingActions: {
        ...state.pendingActions,
        [actionKey]: pending,
      },
    })),
}));
