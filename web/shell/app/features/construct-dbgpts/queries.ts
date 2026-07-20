import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { IAgentPlugin, PostAgentQueryParams, PostDbgptMyQueryParams } from '@/types/agent';
import { constructDbgptsApi } from './api';
import { constructDbgptsKeys, type DbgptsListParams } from './query-keys';

export function useDbgptsList(params: DbgptsListParams) {
  return useQuery({
    queryKey: constructDbgptsKeys.list(params),
    queryFn: async () => {
      if (params.activeKey === 'my') {
        const data: PostDbgptMyQueryParams = {
          name: params.searchValue || undefined,
          type: params.typeStr === 'all' ? undefined : params.typeStr,
          page_index: params.pageNo,
          page_size: params.pageSize,
        };
        const res = await constructDbgptsApi.my(data);
        return (res?.items ?? []) as unknown as IAgentPlugin[];
      }

      const data: PostAgentQueryParams = {
        page_index: params.pageNo,
        page_size: params.pageSize,
        name: params.searchValue || undefined,
        type: params.typeStr === 'all' ? undefined : params.typeStr,
      };
      const res = await constructDbgptsApi.market(data);
      return res?.items ?? [];
    },
  });
}

function useInvalidateDbgpts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: constructDbgptsKeys.lists() });
}

export function useRefreshDbgptsHub() {
  const invalidate = useInvalidateDbgpts();
  return useMutation({
    mutationFn: () => constructDbgptsApi.refreshHub(),
    onSettled: invalidate,
  });
}

export function useInstallDbgpt() {
  const invalidate = useInvalidateDbgpts();
  return useMutation({
    mutationFn: (agent: Pick<IAgentPlugin, 'name' | 'type'>) => constructDbgptsApi.install(agent),
    onSettled: invalidate,
  });
}

export function useUninstallDbgpt() {
  const invalidate = useInvalidateDbgpts();
  return useMutation({
    mutationFn: (agent: Pick<IAgentPlugin, 'name' | 'type'>) => constructDbgptsApi.uninstall(agent),
    onSettled: invalidate,
  });
}
