import { POST } from '@dbgpt/shared';

import type { IChatDialogueSchema, PaginationResult } from '@/types/chat';

export interface ConversationListParams {
  chat_mode?: string;
  user_name?: string;
  sys_code?: string;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const conversationsApi = {
  list: (params: ConversationListParams, page = 1, pageSize = 20) =>
    unwrap<PaginationResult<IChatDialogueSchema>>(
      POST(`/api/v1/chat/dialogue/query_page?page=${page}&page_size=${pageSize}`, params),
    ),
  remove: (convUid: string) => unwrap<unknown>(POST(`/api/v1/chat/dialogue/delete?con_uid=${convUid}`)),
};
