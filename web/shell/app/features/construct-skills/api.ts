import { GET, POST } from '@dbgpt/shared';
import type { ResponseType } from '@dbgpt/shared/api/types';

import type { SkillDetail, SkillItem } from './types';

function assertEnvelope<T>(payload: ResponseType<T>): T {
  if (!payload.success) {
    throw new Error(payload.err_msg || 'Request failed');
  }
  return payload.data;
}

async function data<T>(p: Promise<{ data: ResponseType<T> }>): Promise<T> {
  const res = await p;
  return assertEnvelope(res.data);
}

async function envelope<T>(p: Promise<{ data: ResponseType<T> }>): Promise<ResponseType<T>> {
  const res = await p;
  return res.data;
}

export const constructSkillsApi = {
  list: () => data<SkillItem[]>(GET('/api/v1/skills/list')),
  detail: (params: { skill_name: string; file_path: string }) =>
    data<SkillDetail>(GET('/api/v1/skills/detail', params)),
  upload: (payload: FormData) => envelope<unknown>(POST('/api/v1/skills/upload', payload)),
  importGithub: (url: string) =>
    data<unknown>(POST('/api/v1/skills/import_github', { url }, { timeout: 60000 })),
};
