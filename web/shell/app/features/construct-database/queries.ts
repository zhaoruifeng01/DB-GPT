import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { constructDatabaseApi } from './api';
import { constructDatabaseKeys } from './query-keys';

export function useDatabaseList() {
  return useQuery({
    queryKey: constructDatabaseKeys.list(),
    queryFn: constructDatabaseApi.list,
  });
}

export function useDatabaseSupportTypes() {
  return useQuery({
    queryKey: constructDatabaseKeys.supportTypes(),
    queryFn: constructDatabaseApi.supportTypes,
  });
}

function useInvalidateDatabaseList() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: constructDatabaseKeys.list() });
}

export function useDeleteDatabase() {
  const invalidate = useInvalidateDatabaseList();
  return useMutation({
    mutationFn: (id: string) => constructDatabaseApi.remove(id),
    onSettled: invalidate,
  });
}

export function useRefreshDatabase() {
  const invalidate = useInvalidateDatabaseList();
  return useMutation({
    mutationFn: (id: string) => constructDatabaseApi.refresh({ id }),
    onSettled: invalidate,
  });
}
