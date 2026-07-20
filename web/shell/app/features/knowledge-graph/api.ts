import { POST } from '@dbgpt/shared';

import type { GraphVisResult } from '@/types/knowledge';

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const knowledgeGraphApi = {
  graph: (spaceName: string, data: { limit: number }) =>
    unwrap<GraphVisResult>(POST(`/knowledge/${spaceName}/graphvis`, data)),
};
