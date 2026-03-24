// Generic utility functions for role and farm logic

export function isWorkerRole(role: unknown): boolean {
  if (typeof role !== 'string') return false;
  return role.trim().toUpperCase() === 'WORKER';
}

export function resolveDashboardPath(role: unknown): string {
  return isWorkerRole(role) ? '/worker/dashboard' : '/owner/dashboard';
}

export function resolveRoleFromFarms(
  farms: Array<{ id: string; role?: string }>,
  activeFarmId: string | null,
): string | null {
  if (!activeFarmId) return null;
  const farm = farms.find((item) => item.id === activeFarmId);
  return farm?.role ?? null;
}
