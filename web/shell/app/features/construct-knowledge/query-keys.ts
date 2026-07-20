import type { ChunkListParams } from '@/types/knowledge';
import type { SpaceListParams } from './api';

export const constructKnowledgeKeys = {
  all: ['construct-knowledge'] as const,
  spaces: () => [...constructKnowledgeKeys.all, 'spaces'] as const,
  spaceList: (params: SpaceListParams) => [...constructKnowledgeKeys.spaces(), params] as const,
  config: () => [...constructKnowledgeKeys.all, 'config'] as const,
  chunks: (spaceName: string, params: ChunkListParams) =>
    [...constructKnowledgeKeys.all, 'chunks', spaceName, params] as const,
};
