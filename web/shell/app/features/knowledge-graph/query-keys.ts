export const knowledgeGraphKeys = {
  all: ['knowledge-graph'] as const,
  graph: (spaceName: string, limit: number) => [...knowledgeGraphKeys.all, spaceName, limit] as const,
};
