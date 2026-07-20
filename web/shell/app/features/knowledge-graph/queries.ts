import { useQuery } from '@tanstack/react-query';

import { knowledgeGraphApi } from './api';
import { knowledgeGraphKeys } from './query-keys';

export function useKnowledgeGraph(spaceName: string, limit: number) {
  return useQuery({
    queryKey: knowledgeGraphKeys.graph(spaceName, limit),
    queryFn: () => knowledgeGraphApi.graph(spaceName, { limit }),
    enabled: !!spaceName,
  });
}
