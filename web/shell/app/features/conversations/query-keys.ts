import type { ConversationListParams } from './api';

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (params: ConversationListParams, page: number, pageSize: number) =>
    [...conversationKeys.lists(), params, page, pageSize] as const,
};
