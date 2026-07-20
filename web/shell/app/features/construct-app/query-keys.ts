import type { AppListParams } from './api';

export const constructAppKeys = {
  all: ['construct-app'] as const,
  lists: () => [...constructAppKeys.all, 'list'] as const,
  list: (params: AppListParams) => [...constructAppKeys.lists(), params] as const,
  admins: (appCode: string) => [...constructAppKeys.all, 'admins', appCode] as const,
};
