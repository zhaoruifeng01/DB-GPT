import { POST } from '@dbgpt/shared';

import type {
  IAgentPlugin,
  PostAgentHubUpdateParams,
  PostAgentPluginResponse,
  PostAgentQueryParams,
  PostDbgptMyQueryParams,
  PostAgentMyPluginResponse,
} from '@/types/agent';

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const constructDbgptsApi = {
  market: (data: PostAgentQueryParams) =>
    unwrap<PostAgentPluginResponse>(
      POST(`/api/v1/serve/dbgpts/hub/query_page?page=${data?.page_index}&page_size=${data?.page_size}`, data),
    ),
  my: (data: PostDbgptMyQueryParams) =>
    unwrap<PostAgentMyPluginResponse>(
      POST(`/api/v1/serve/dbgpts/my/query_page?page=${data?.page_index}&page_size=${data?.page_size}`, data),
    ),
  refreshHub: (data?: PostAgentHubUpdateParams) =>
    unwrap<unknown>(
      POST('/api/v1/serve/dbgpts/hub/source/refresh', data ?? { channel: '', url: '', branch: '', authorization: '' }),
    ),
  install: (data: Pick<IAgentPlugin, 'name' | 'type'>) =>
    unwrap<unknown>(POST('/api/v1/serve/dbgpts/hub/install', data, { timeout: 60000 })),
  uninstall: (data: Pick<IAgentPlugin, 'name' | 'type'>) =>
    unwrap<unknown>(POST('/api/v1/serve/dbgpts/my/uninstall', undefined, { params: data, timeout: 60000 })),
};
