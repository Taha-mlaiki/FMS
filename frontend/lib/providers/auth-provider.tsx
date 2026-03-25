'use client';

import { useEffect, useRef } from 'react';
import { getMe, refreshSession } from '@/lib/api/auth';
import { clearUserRoleCookie, setUserRoleCookie } from '@/lib/auth-role-cookie';
import { listFarms, listOwnedFarms } from '@/lib/api/farm';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePreferencesStore } from '@/lib/stores/preferences.store';

async function waitForAuthStoreHydration() {
  const persisted = (
    useAuthStore as typeof useAuthStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (listener: () => void) => () => void;
      };
    }
  ).persist;

  if (!persisted?.hasHydrated || persisted.hasHydrated()) return;

  await new Promise<void>((resolve) => {
    const unsubscribe: (() => void) | undefined =
      persisted.onFinishHydration?.(() => {
        unsubscribe?.();
        resolve();
      });
  });
}

/**
 * Restores the user's session on every page load by calling the refresh
 * endpoint. Routing and role-based access control are handled entirely by
 * middleware.ts — this provider only manages client-side session state.
 */
export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initializationRef = useRef(false);

  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    async function restoreSession() {
      try {
        // Ensure persisted auth state has been fully loaded before restore.
        // Otherwise, late hydration can overwrite the fresh user profile.
        await waitForAuthStoreHydration();

        const refreshResponse = await refreshSession();
        useAuthStore.getState().setAccessToken(refreshResponse.accessToken);

        const [profile, ownerFarms] = await Promise.all([
          getMe(),
          listOwnedFarms().catch(() => []),
        ]);
        const farms =
          ownerFarms.length > 0
            ? ownerFarms
            : await listFarms().catch(() => []);

        const persistedFarms = useAuthStore.getState().farms;
        const fallbackCurrentFarm =
          (refreshResponse.currentFarm ?? refreshResponse.current_farm)
            ? [
                {
                  id:
                    (
                      refreshResponse.currentFarm ??
                      refreshResponse.current_farm
                    )?.id ?? '',
                  name:
                    (
                      refreshResponse.currentFarm ??
                      refreshResponse.current_farm
                    )?.name ?? 'Farm',
                  location: undefined,
                  address: undefined,
                  schemaName: (
                    refreshResponse.currentFarm ?? refreshResponse.current_farm
                  )?.schema_name,
                  status: (
                    refreshResponse.currentFarm ?? refreshResponse.current_farm
                  )?.status,
                  createdAt: (
                    refreshResponse.currentFarm ?? refreshResponse.current_farm
                  )?.created_at,
                  role: profile.role === 'WORKER' ? 'WORKER' : 'OWNER',
                },
              ].filter((farm) => Boolean(farm.id))
            : [];

        let effectiveFarms = farms;
        if (effectiveFarms.length === 0 && persistedFarms.length > 0) {
          effectiveFarms = persistedFarms.map((farm) => ({
            id: farm.id,
            name: farm.name,
            location: farm.location,
            address: farm.address,
            schemaName: farm.schema_name,
            status: farm.status,
            createdAt: farm.created_at,
            role: farm.role,
          }));
        }
        if (effectiveFarms.length === 0) {
          effectiveFarms = fallbackCurrentFarm;
        }

        const lastFarmId = usePreferencesStore.getState().lastActiveFarmId;
        const fallbackFarmId =
          refreshResponse.currentFarm?.id ??
          refreshResponse.current_farm?.id ??
          null;
        const firstOwnerFarmId =
          effectiveFarms.find((farm) => farm.role === 'OWNER')?.id ?? null;
        const activeFarmId =
          effectiveFarms.find((farm) => farm.id === lastFarmId)?.id ??
          effectiveFarms.find((farm) => farm.id === fallbackFarmId)?.id ??
          firstOwnerFarmId ??
          effectiveFarms[0]?.id ??
          null;

        const activeFarmRole =
          profile.role?.toUpperCase?.() === 'WORKER'
            ? 'WORKER'
            : (effectiveFarms.find((farm) => farm.id === activeFarmId)?.role ??
              profile.role ??
              null);

        setUserRoleCookie(activeFarmRole);

        if (activeFarmId) {
          usePreferencesStore.getState().setLastActiveFarmId(activeFarmId);
        }

        useAuthStore.getState().setSession({
          accessToken: refreshResponse.accessToken,
          user: profile,
          farms: effectiveFarms.map((farm) => ({
            id: farm.id,
            name: farm.name,
            location: farm.location ?? farm.address,
            address: farm.address ?? farm.location,
            schema_name: farm.schemaName,
            status: farm.status,
            created_at: farm.createdAt,
            role: farm.role,
          })),
          activeFarmId,
          currentFarm:
            refreshResponse.currentFarm ?? refreshResponse.current_farm ?? null,
        });
      } catch {
        useAuthStore.getState().clearSession();
        clearUserRoleCookie();
      }
    }

    void restoreSession();
  }, []);

  return <>{children}</>;
}
