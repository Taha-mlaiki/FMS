export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },
  farms: {
    all: () => ['farms'] as const,
    detail: (farmId: string) => ['farms', farmId] as const,
  },
  members: {
    all: (farmId: string) => ['members', farmId] as const,
  },
  workers: {
    all: (farmId: string) => ['workers', farmId] as const,
  },
  groups: {
    all: (farmId: string) => ['groups', farmId] as const,
    detail: (farmId: string, groupId: string) =>
      ['groups', farmId, groupId] as const,
  },
  tasks: {
    templates: (farmId: string) => ['tasks', farmId, 'templates'] as const,
    templateDetail: (farmId: string, templateId: string) =>
      ['tasks', farmId, 'templates', templateId] as const,
    categories: (farmId: string) => ['tasks', farmId, 'categories'] as const,
  },
  occurrences: {
    all: (farmId: string) => ['occurrences', farmId] as const,
    detail: (farmId: string, occurrenceId: string) =>
      ['occurrences', farmId, occurrenceId] as const,
    count: (farmId: string) => ['occurrences', farmId, 'count'] as const,
  },
  metrics: {
    all: (farmId: string) => ['metrics', farmId] as const,
    types: (farmId: string) => ['metric-types', farmId] as const,
  },
  stock: {
    materials: (farmId: string) => ['stock', farmId, 'materials'] as const,
    transactions: (farmId: string) =>
      ['stock', farmId, 'transactions'] as const,
    alerts: (farmId: string) => ['stock', farmId, 'alerts'] as const,
    alertsCount: (farmId: string) => ['stock', farmId, 'alerts-count'] as const,
    analytics: (farmId: string) => ['stock', farmId, 'analytics'] as const,
  },
  reports: {
    all: (farmId: string) => ['reports', farmId] as const,
    detail: (farmId: string, reportId: string) =>
      ['reports', farmId, reportId] as const,
    analytics: (farmId: string) => ['reports', farmId, 'analytics'] as const,
  },
  dashboard: {
    worker: (farmId: string) => ['dashboard', farmId, 'worker'] as const,
    owner: (farmId: string, period: string) =>
      ['dashboard', farmId, 'owner', period] as const,
  },
};
