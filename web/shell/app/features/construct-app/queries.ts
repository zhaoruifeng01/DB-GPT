import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { constructAppApi, type AppListParams } from './api';
import { constructAppKeys } from './query-keys';
import type { CreateAppParams } from '@/types/app';
import type { NewDialogueParam } from '@/types/chat';

export function useAppList(params: AppListParams) {
  return useQuery({
    queryKey: constructAppKeys.list(params),
    queryFn: () => constructAppApi.list(params),
  });
}

function useInvalidateAppList() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: constructAppKeys.lists() });
}

export function usePublishApp() {
  const invalidate = useInvalidateAppList();
  return useMutation({
    mutationFn: ({ appCode, published }: { appCode: string; published?: string }) =>
      published === 'true' ? constructAppApi.unpublish(appCode) : constructAppApi.publish(appCode),
    onSettled: invalidate,
  });
}

export function useDeleteApp() {
  const invalidate = useInvalidateAppList();
  return useMutation({
    mutationFn: (appCode: string) => constructAppApi.remove(appCode),
    onSettled: invalidate,
  });
}

export function useUpdateApp() {
  const invalidate = useInvalidateAppList();
  return useMutation({
    mutationFn: (data: CreateAppParams) => constructAppApi.update(data),
    onSettled: invalidate,
  });
}

export function useCreateApp() {
  const invalidate = useInvalidateAppList();
  return useMutation({
    mutationFn: (data: CreateAppParams) => constructAppApi.create(data),
    onSettled: invalidate,
  });
}

export function useTeamModes() {
  return useQuery({
    queryKey: constructAppKeys.teamModes(),
    queryFn: () => constructAppApi.teamModes(),
  });
}

export function useNewAppDialogue() {
  return useMutation({
    mutationFn: (data: NewDialogueParam) => constructAppApi.newDialogue(data),
  });
}
