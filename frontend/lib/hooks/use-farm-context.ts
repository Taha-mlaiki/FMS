import { useAuthStore } from '@/lib/stores/auth.store';

export function useFarmContext() {
  const activeFarmId = useAuthStore((state) => state.activeFarmId);
  const activeFarmRole = useAuthStore((state) => state.activeFarmRole);
  const user = useAuthStore((state) => state.user);
  const farms = useAuthStore((state) => state.farms);

  const farm = farms.find((item) => item.id === activeFarmId) ?? null;

  return {
    farmId: activeFarmId,
    role: activeFarmRole,
    farm,
    farms,
    user,
    userId: user?.id ?? null,
    isOwner: activeFarmRole === 'OWNER',
    isWorker: activeFarmRole === 'WORKER',
  };
}
