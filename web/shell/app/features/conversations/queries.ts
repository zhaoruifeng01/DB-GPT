import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { conversationsApi, type ConversationListParams } from './api';
import { conversationKeys } from './query-keys';

export function useConversationList(params: ConversationListParams, page: number, pageSize: number) {
  return useQuery({
    queryKey: conversationKeys.list(params, page, pageSize),
    queryFn: () => conversationsApi.list(params, page, pageSize),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (convUid: string) => conversationsApi.remove(convUid),
    onSettled: () => qc.invalidateQueries({ queryKey: conversationKeys.lists() }),
  });
}
