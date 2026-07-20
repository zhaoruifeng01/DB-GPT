import { GET, POST } from '@dbgpt/shared';

import type { NewDialogueParam, IChatDialogueSchema } from '@/types/chat';
import type { AppListResponse, CreateAppParams, IApp, TeamMode } from '@/types/app';

export interface AppListParams {
  page?: number;
  page_size?: number;
  app_name?: string;
  published?: 'true' | 'false';
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const constructAppApi = {
  list: (data: AppListParams = {}) => {
    const page = data.page || 1;
    const pageSize = data.page_size || 12;
    return unwrap<AppListResponse>(POST(`/api/v1/app/list?page=${page}&page_size=${pageSize}`, data));
  },
  publish: (appCode: string) => unwrap<[]>(POST('/api/v1/app/publish', { app_code: appCode })),
  unpublish: (appCode: string) => unwrap<[]>(POST('/api/v1/app/unpublish', { app_code: appCode })),
  remove: (appCode: string) => unwrap<[]>(POST('/api/v1/app/remove', { app_code: appCode })),
  create: (data: CreateAppParams) => unwrap<IApp>(POST('/api/v1/app/create', data)),
  update: (data: CreateAppParams) => unwrap<IApp>(POST('/api/v1/app/edit', data)),
  teamModes: () => unwrap<TeamMode[]>(GET('/api/v1/team-mode/list')),
  admins: (appCode: string) => unwrap<string[]>(GET(`/api/v1/app/${appCode}/admins`)),
  updateAdmins: (data: { app_code: string; admins: string[] }) =>
    unwrap<null>(POST('/api/v1/app/admins/update', data)),
  newDialogue: (data: NewDialogueParam) => {
    const params = new URLSearchParams({ chat_mode: data.chat_mode });
    if (data.model) {
      params.set('model_name', data.model);
    }
    return unwrap<IChatDialogueSchema>(POST(`/api/v1/chat/dialogue/new?${params.toString()}`, data));
  },
};
