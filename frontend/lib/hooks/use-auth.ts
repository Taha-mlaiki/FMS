import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginUser, logoutUser, registerUser } from '@/lib/api/auth';
import { clearUserRoleCookie, setUserRoleCookie } from '@/lib/auth-role-cookie';
import { listFarms, listOwnedFarms } from '@/lib/api/farm';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/error-handler';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePreferencesStore } from '@/lib/stores/preferences.store';
import { resolveDashboardPath, resolveRoleFromFarms } from '@/lib/auth-utils';
import type {
  LoginFormData,
  RegisterFormData,
} from '@/lib/validations/auth.schema';

export function clearAuthTokens() {
  useAuthStore.getState().clearSession();
  clearUserRoleCookie();
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginFormData) => loginUser(data),
    onSuccess: async (response) => {
      useAuthStore.getState().setAccessToken(response.accessToken);
      const ownerFarms = await listOwnedFarms().catch(() => []);
      const farms =
        ownerFarms.length > 0 ? ownerFarms : await listFarms().catch(() => []);
      const fallbackCurrentFarm =
        (response.currentFarm ?? response.current_farm)
          ? [
              {
                id: (response.currentFarm ?? response.current_farm)?.id ?? '',
                name:
                  (response.currentFarm ?? response.current_farm)?.name ??
                  'مزرعة',
                location: undefined,
                address: undefined,
                schemaName: (response.currentFarm ?? response.current_farm)
                  ?.schema_name,
                status: (response.currentFarm ?? response.current_farm)?.status,
                createdAt: (response.currentFarm ?? response.current_farm)
                  ?.created_at,
                // Preserve the authenticated user's role for the fallback farm to
                // avoid forcing OWNER and mis-routing workers after refresh.
                role: (response.user?.role?.toUpperCase?.() === 'WORKER'
                  ? 'WORKER'
                  : 'OWNER') as 'WORKER' | 'OWNER',
              },
            ].filter((farm) => Boolean(farm.id))
          : [];
      const effectiveFarms = farms.length > 0 ? farms : fallbackCurrentFarm;
      const lastFarmId = usePreferencesStore.getState().lastActiveFarmId;
      const fallbackFarmId =
        response.currentFarm?.id ?? response.current_farm?.id;
      const firstOwnerFarmId = effectiveFarms.find(
        (farm) => farm.role === 'OWNER',
      )?.id;
      const activeFarmId =
        effectiveFarms.find((farm) => farm.id === lastFarmId)?.id ??
        effectiveFarms.find((farm) => farm.id === fallbackFarmId)?.id ??
        firstOwnerFarmId ??
        effectiveFarms[0]?.id ??
        null;
      const activeFarmRole = resolveRoleFromFarms(effectiveFarms, activeFarmId);

      setUserRoleCookie(activeFarmRole ?? response.user?.role);

      if (activeFarmId) {
        usePreferencesStore.getState().setLastActiveFarmId(activeFarmId);
      }

      useAuthStore.getState().setSession({
        accessToken: response.accessToken,
        user: response.user,
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
        currentFarm: response.currentFarm ?? response.current_farm ?? null,
      });
      toast.success('تم تسجيل الدخول بنجاح', {
        description: `مرحباً ${response.user?.first_name || ''}`,
      });

      const redirectTo =
        globalThis.window === undefined
          ? null
          : new URLSearchParams(globalThis.window.location.search).get(
              'redirect',
            );

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      router.push(resolveDashboardPath(activeFarmRole ?? response.user?.role));
    },
    onError: (error) => {
      toast.error('فشل تسجيل الدخول', {
        description: getApiErrorMessage(error),
      });
    },
  });
}

export function useRegister(options?: { invitationToken?: string | null }) {
  const router = useRouter();
  const invitationToken = options?.invitationToken?.trim() || null;

  return useMutation({
    mutationFn: (data: RegisterFormData) => registerUser(data),
    onSuccess: async (response, variables) => {
      useAuthStore.getState().setAccessToken(response.accessToken);
      let farms = await listOwnedFarms().catch(() => []);
      if (farms.length === 0) {
        farms = await listFarms().catch(() => []);
      }
      if (
        farms.length === 0 &&
        (response.currentFarm ?? response.current_farm)
      ) {
        const currentFarm = response.currentFarm ?? response.current_farm;
        if (currentFarm) {
          farms = [
            {
              id: currentFarm.id,
              name: currentFarm.name,
              location: undefined,
              address: undefined,
              schemaName: currentFarm.schema_name,
              status: currentFarm.status,
              createdAt: currentFarm.created_at,
              // Mirror the authenticated user's role for the fallback farm so
              // workers do not get forced into owner space after refresh.
              role: (response.user?.role?.toUpperCase?.() === 'WORKER'
                ? 'WORKER'
                : 'OWNER') as 'WORKER' | 'OWNER',
            },
          ].filter((farm) => Boolean(farm.id));
        }
      }
      let activeFarmId =
        farms.find((farm) => farm.role === 'OWNER')?.id ?? farms[0]?.id ?? null;

      if (invitationToken) {
        const acceptance = await api
          .post<{
            farmId?: string;
            farm_id?: string;
          }>(`/invitations/${invitationToken}/accept`, {})
          .catch(() => null);

        farms = await listFarms().catch(() => farms);

        const acceptedFarmId =
          acceptance?.data?.farmId ?? acceptance?.data?.farm_id ?? null;
        activeFarmId =
          farms.find((farm) => farm.id === acceptedFarmId)?.id ??
          farms.find((farm) => farm.role === 'OWNER')?.id ??
          farms[0]?.id ??
          null;
      }

      if (activeFarmId) {
        usePreferencesStore.getState().setLastActiveFarmId(activeFarmId);
      }

      const activeFarmRole = resolveRoleFromFarms(farms, activeFarmId);
      setUserRoleCookie(activeFarmRole ?? response.user?.role);

      useAuthStore.getState().setSession({
        accessToken: response.accessToken,
        user: response.user,
        farms: farms.map((farm) => ({
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
        currentFarm: response.currentFarm ?? response.current_farm ?? null,
      });
      toast.success('تم إنشاء الحساب بنجاح', {
        description: 'مرحباً بك في نظام إدارة المزارع',
      });

      if (invitationToken) {
        router.push(
          resolveDashboardPath(activeFarmRole ?? response.user?.role),
        );
        return;
      }

      router.push(resolveDashboardPath(activeFarmRole ?? response.user?.role));
    },
    onError: (error) => {
      toast.error('فشل إنشاء الحساب', {
        description: getApiErrorMessage(error),
      });
    },
  });
}

export function useLogout() {
  return async () => {
    try {
      await logoutUser();
    } catch {
      // Even if API logout fails, clear local in-memory session.
    }
    useAuthStore.getState().clearSession();
    clearUserRoleCookie();
    // Clear the persisted farm preference so the next login starts fresh.
    usePreferencesStore.getState().setLastActiveFarmId(null);
    toast.success('تم تسجيل الخروج');
    // Use hard navigation so the browser fully reloads at '/'.
    // router.replace('/') would lose the race against the auth-provider's
    // useEffect (which fires when accessToken becomes null and redirects to
    // /login). window.location bypasses Next.js routing entirely.
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };
}
