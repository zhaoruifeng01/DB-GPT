import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewDialogueParam } from '@/types/chat';
import type { IFlowUpdateParam } from '@/types/flow';
import { constructFlowApi, type FlowListParams } from './api';
import { constructFlowKeys } from './query-keys';

export function useFlowList(params: FlowListParams) {
  return useQuery({
    queryKey: constructFlowKeys.list(params),
    queryFn: () => constructFlowApi.list(params),
  });
}

export function useFlowDetail(uid?: string) {
  return useQuery({
    queryKey: constructFlowKeys.detail(uid),
    queryFn: () => constructFlowApi.detail(uid ?? ''),
    enabled: Boolean(uid),
  });
}

function useInvalidateFlowList() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: constructFlowKeys.lists() });
  };
}

export function useCopyFlow() {
  const invalidate = useInvalidateFlowList();
  return useMutation({
    mutationFn: (data: IFlowUpdateParam) => constructFlowApi.add(data),
    onSettled: invalidate,
  });
}

export function useDeleteFlow() {
  const invalidate = useInvalidateFlowList();
  return useMutation({
    mutationFn: (uid: string) => constructFlowApi.remove(uid),
    onSettled: invalidate,
  });
}

export function useNewFlowDialogue() {
  return useMutation({
    mutationFn: (data: NewDialogueParam) => constructFlowApi.newDialogue(data),
  });
}
