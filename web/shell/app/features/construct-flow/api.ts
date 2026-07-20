import { DELETE, GET, POST } from '@dbgpt/shared';

import type { IChatDialogueSchema, NewDialogueParam } from '@/types/chat';
import type { IFlow, IFlowResponse, IFlowUpdateParam } from '@/types/flow';

export interface FlowListParams {
  page?: number;
  page_size?: number;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const constructFlowApi = {
  list: (params: FlowListParams = {}) =>
    unwrap<IFlowResponse>(
      GET('/api/v2/serve/awel/flows', {
        page: params.page ?? 1,
        page_size: params.page_size ?? 12,
      }),
    ),
  add: (data: IFlowUpdateParam) => unwrap<IFlow>(POST('/api/v2/serve/awel/flows', data)),
  detail: (uid: string) => unwrap<IFlow>(GET(`/api/v2/serve/awel/flows/${uid}`)),
  remove: (uid: string) => unwrap<null>(DELETE(`/api/v2/serve/awel/flows/${uid}`)),
  newDialogue: (data: NewDialogueParam) => {
    const params = new URLSearchParams({ chat_mode: data.chat_mode });
    if (data.model) {
      params.set('model_name', data.model);
    }
    return unwrap<IChatDialogueSchema>(POST(`/api/v1/chat/dialogue/new?${params.toString()}`, data));
  },
};
