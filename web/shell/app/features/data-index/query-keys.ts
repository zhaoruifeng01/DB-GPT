import type { DataIndexListParams } from './api';

export type DataIndexTabKey = 'recommend' | 'all' | 'collected';

export const dataIndexKeys = {
  all: ['data-index'] as const,
  lists: () => [...dataIndexKeys.all, 'list'] as const,
  list: (tab: DataIndexTabKey, params: DataIndexListParams) => [...dataIndexKeys.lists(), tab, params] as const,
};
