import type { FlowListParams } from './api';

export const constructFlowKeys = {
  all: ['construct-flow'] as const,
  lists: () => [...constructFlowKeys.all, 'list'] as const,
  list: (params: FlowListParams) => [...constructFlowKeys.lists(), params] as const,
  detail: (uid?: string) => [...constructFlowKeys.all, 'detail', uid ?? ''] as const,
};
