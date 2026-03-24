import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessTokenCookie, clearAccessTokenCookie } from '@/lib/token-cookie';

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
}

export interface AuthFarm {
  id: string;
  name: string;
  location?: string;
  address?: string;
  schema_name?: string;
  status?: string;
  created_at?: string;
  role?: 'OWNER' | 'WORKER' | string;
}

export type FarmRole = 'OWNER' | 'WORKER';

interface AuthStore {
  accessToken: string | null;
  user: AuthUser | null;
  farms: AuthFarm[];
  activeFarmId: string | null;
  activeFarmRole: FarmRole | null;
  currentFarm: AuthFarm | null;
  isSessionReady: boolean;
  setSession: (data: {
    accessToken: string;
    user: AuthUser | null;
    farms?: AuthFarm[];
    activeFarmId?: string | null;
    currentFarm?: AuthFarm | null;
  }) => void;
  setFarms: (farms: AuthFarm[]) => void;
  setActiveFarm: (farmId: string, role?: FarmRole | string) => void;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  clearSession: () => void;
  markSessionReady: () => void;
}

function resolvePreferredFarm(
  farms: AuthFarm[],
  preferredFarmId?: string | null,
  userRole?: string | null,
): AuthFarm | null {
  if (preferredFarmId) {
    const preferred = farms.find((farm) => farm.id === preferredFarmId);
    if (preferred) return preferred;
  }

  // If the authenticated user is a worker, prefer a farm marked as WORKER to
  // prevent defaulting to the first OWNER farm when switching accounts.
  if (userRole?.toUpperCase?.() === 'WORKER') {
    const workerFarm = farms.find((farm) => farm.role === 'WORKER');
    if (workerFarm) return workerFarm;
  }

  return farms.find((farm) => farm.role === 'OWNER') ?? farms[0] ?? null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      farms: [],
      activeFarmId: null,
      activeFarmRole: null,
      currentFarm: null,
      isSessionReady: false,
      setSession: ({ accessToken, user, farms, activeFarmId, currentFarm }) =>
        set((state) => {
          const incomingFarms = farms ?? (currentFarm ? [currentFarm] : []);
          const nextFarms =
            incomingFarms.length > 0 ? incomingFarms : state.farms;
          const preferredFarm = resolvePreferredFarm(
            nextFarms,
            activeFarmId ?? currentFarm?.id ?? state.activeFarmId ?? null,
            user?.role ?? state.user?.role ?? null,
          );
          const resolvedRole =
            (user?.role?.toUpperCase?.() === 'WORKER' ? 'WORKER' : null) ??
            (preferredFarm?.role === 'OWNER' || preferredFarm?.role === 'WORKER'
              ? preferredFarm.role
              : null) ??
            null;

          return {
            accessToken,
            user,
            farms: nextFarms,
            activeFarmId: preferredFarm?.id ?? null,
            activeFarmRole: resolvedRole,
            currentFarm: preferredFarm,
            isSessionReady: true,
          };
        }),
      setFarms: (farms) =>
        set((state) => {
          const preferredFarm = resolvePreferredFarm(
            farms,
            state.activeFarmId,
            state.user?.role ?? null,
          );
          const activeFarmRole =
            (state.user?.role?.toUpperCase?.() === 'WORKER'
              ? 'WORKER'
              : null) ??
            (preferredFarm?.role === 'OWNER' || preferredFarm?.role === 'WORKER'
              ? preferredFarm.role
              : null) ??
            null;

          return {
            farms,
            activeFarmId: preferredFarm?.id ?? null,
            activeFarmRole,
            currentFarm: preferredFarm,
          };
        }),
      setActiveFarm: (farmId, role) =>
        set((state) => {
          const currentFarm =
            state.farms.find((farm) => farm.id === farmId) ?? null;
          const inferredRole =
            role ??
            (currentFarm?.role === 'OWNER' || currentFarm?.role === 'WORKER'
              ? currentFarm.role
              : null);

          return {
            activeFarmId: farmId,
            activeFarmRole:
              inferredRole === 'OWNER' || inferredRole === 'WORKER'
                ? inferredRole
                : null,
            currentFarm,
          };
        }),
      setAccessToken: (token) => {
        if (token) setAccessTokenCookie(token);
        else clearAccessTokenCookie();
        set({ accessToken: token });
      },
      setUser: (user) => set({ user }),
      clearSession: () => {
        clearAccessTokenCookie();
        set({
          accessToken: null,
          user: null,
          farms: [],
          activeFarmId: null,
          activeFarmRole: null,
          currentFarm: null,
          isSessionReady: true,
        });
      },
      markSessionReady: () => set({ isSessionReady: true }),
    }),
    {
      name: 'fms-auth-store',
      partialize: (state) => ({
        user: state.user,
        farms: state.farms,
        activeFarmId: state.activeFarmId,
        activeFarmRole: state.activeFarmRole,
        currentFarm: state.currentFarm,
      }),
    },
  ),
);
