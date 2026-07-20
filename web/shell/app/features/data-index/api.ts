import { POST } from '@dbgpt/shared';

import type { AppListResponse, IApp } from '@/types/app';
import type { IChatDialogueSchema, NewDialogueParam } from '@/types/chat';

export interface DataIndexListParams {
  page?: number;
  page_size?: number;
  app_name?: string;
  is_collected?: 'true';
  ignore_user?: 'true';
  published?: 'true';
  need_owner_info?: 'true';
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const dataIndexApi = {
  list: (data: DataIndexListParams = {}) => {
    const page = data.page || 1;
    const pageSize = data.page_size || 12;
    return unwrap<AppListResponse>(POST(`/api/v1/app/list?page=${page}&page_size=${pageSize}`, data));
  },
  recommend: (data: DataIndexListParams = {}) => {
    return unwrap<IApp[]>(POST('/api/v1/app/hot/list', data));
  },
  collect: (appCode: string) => unwrap<[]>(POST('/api/v1/app/collect', { app_code: appCode })),
  uncollect: (appCode: string) => unwrap<[]>(POST('/api/v1/app/uncollect', { app_code: appCode })),
  newDialogue: (data: NewDialogueParam) => {
    const params = new URLSearchParams({ chat_mode: data.chat_mode });
    if (data.model) {
      params.set('model_name', data.model);
    }
    return unwrap<IChatDialogueSchema>(POST(`/api/v1/chat/dialogue/new?${params.toString()}`, data));
  },
};
