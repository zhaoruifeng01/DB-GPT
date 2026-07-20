import { GET, POST } from '@dbgpt/shared';

import type { IChatDialogueSchema, NewDialogueParam } from '@/types/chat';
import type { ChunkListParams, IChunkList, ISpace, SpaceConfig } from '@/types/knowledge';

export interface SpaceListParams {
  name?: string;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const constructKnowledgeApi = {
  spaces: (data: SpaceListParams = {}) => unwrap<ISpace[]>(POST('/knowledge/space/list', data)),
  config: () => unwrap<SpaceConfig>(GET('/knowledge/space/config')),
  removeSpace: (name: string) => unwrap<null>(POST('/knowledge/space/delete', { name })),
  chunks: (spaceName: string, data: ChunkListParams) =>
    unwrap<IChunkList>(POST(`/knowledge/${spaceName}/chunk/list`, data)),
  addChunkQuestions: (data: { chunk_id: string | number; questions: string[] }) =>
    unwrap<string[]>(POST('/knowledge/questions/chunk/edit', data)),
  newDialogue: (data: NewDialogueParam) => {
    const params = new URLSearchParams({ chat_mode: data.chat_mode });
    if (data.model) {
      params.set('model_name', data.model);
    }
    return unwrap<IChatDialogueSchema>(POST(`/api/v1/chat/dialogue/new?${params.toString()}`, data));
  },
};
