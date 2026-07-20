import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dataIndexApi, type DataIndexListParams } from './api';
import { dataIndexKeys, type DataIndexTabKey } from './query-keys';
import type { NewDialogueParam } from '@/types/chat';

export function useDataIndexApps(tab: DataIndexTabKey, params: DataIndexListParams) {
  return useQuery({
    queryKey: dataIndexKeys.list(tab, params),
    queryFn: async () => {
      if (tab === 'recommend') {
        const appList = await dataIndexApi.recommend(params);
        return {
          app_list: appList,
          total_count: appList.length,
          current_page: 1,
          total_page: 1,
        };
      }

      return dataIndexApi.list(params);
    },
  });
}

function useInvalidateDataIndexApps() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: dataIndexKeys.lists() });
}

export function useToggleAppCollection() {
  const invalidate = useInvalidateDataIndexApps();
  return useMutation({
    mutationFn: ({ appCode, collected }: { appCode: string; collected: boolean }) =>
      collected ? dataIndexApi.uncollect(appCode) : dataIndexApi.collect(appCode),
    onSettled: invalidate,
  });
}

export function useDataIndexNewDialogue() {
  return useMutation({
    mutationFn: (data: NewDialogueParam) => dataIndexApi.newDialogue(data),
  });
}
