import { useFarmContext } from '@/lib/hooks/use-farm-context';

const PERMISSIONS = {
  'create:farm': ['OWNER'],
  'create:group': ['OWNER'],
  'update:group': ['OWNER'],
  'create:task-template': ['OWNER'],
  'update:task-template': ['OWNER'],
  'delete:task-template': ['OWNER'],
  'complete:task': ['OWNER', 'WORKER'],
  'skip:task': ['OWNER', 'WORKER'],
  'manage:stock': ['OWNER'],
  'view:stock': ['OWNER', 'WORKER'],
  'create:transaction': ['OWNER'],
  'create:report': ['OWNER', 'WORKER'],
  'view:all-reports': ['OWNER'],
  'update:report-status': ['OWNER'],
  'invite:member': ['OWNER'],
  'deactivate:member': ['OWNER'],
  'manage:metric-types': ['OWNER'],
  'view:full-dashboard': ['OWNER'],
  'update:farm': ['OWNER'],
} as const;

export type PermissionAction = keyof typeof PERMISSIONS;

export function usePermission(action: PermissionAction): boolean {
  const { role } = useFarmContext();
  if (!role) return false;
  return (PERMISSIONS[action] as readonly string[]).includes(role);
}
