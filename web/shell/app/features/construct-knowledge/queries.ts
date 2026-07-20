import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ChunkListParams } from '@/types/knowledge';
import type { NewDialogueParam } from '@/types/chat';
import { constructKnowledgeApi, type SpaceListParams } from './api';
import { constructKnowledgeKeys } from './query-keys';

export function useKnowledgeSpaces(params: SpaceListParams = {}) {
  return useQuery({
    queryKey: constructKnowledgeKeys.spaceList(params),
    queryFn: () => constructKnowledgeApi.spaces(params),
  });
}

export function useKnowledgeConfig() {
  return useQuery({
    queryKey: constructKnowledgeKeys.config(),
    queryFn: constructKnowledgeApi.config,
  });
}

export function useDeleteKnowledgeSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => constructKnowledgeApi.removeSpace(name),
    onSettled: () => qc.invalidateQueries({ queryKey: constructKnowledgeKeys.spaces() }),
  });
}

export function useKnowledgeChunks(spaceName: string, params: ChunkListParams, enabled: boolean) {
  return useQuery({
    queryKey: constructKnowledgeKeys.chunks(spaceName, params),
    queryFn: () => constructKnowledgeApi.chunks(spaceName, params),
    enabled,
  });
}

export function useAddChunkQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { chunk_id: string | number; questions: string[] }) =>
      constructKnowledgeApi.addChunkQuestions(data),
    onSettled: () => qc.invalidateQueries({ queryKey: constructKnowledgeKeys.all }),
  });
}

export function useNewKnowledgeDialogue() {
  return useMutation({
    mutationFn: (data: NewDialogueParam) => constructKnowledgeApi.newDialogue(data),
  });
}
