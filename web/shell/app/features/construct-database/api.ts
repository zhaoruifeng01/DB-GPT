import { DELETE, GET, POST } from '@dbgpt/shared';

import type { DbListResponse, DbSupportTypeResponse, PostDbRefreshParams } from '@/types/db';

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const constructDatabaseApi = {
  list: () => unwrap<DbListResponse>(GET('/api/v2/serve/datasources')),
  supportTypes: () => unwrap<DbSupportTypeResponse>(GET('/api/v2/serve/datasource-types')),
  remove: (id: string) => unwrap<unknown>(DELETE(`/api/v2/serve/datasources/${id}`)),
  refresh: (data: PostDbRefreshParams) => unwrap<boolean>(POST(`/api/v2/serve/datasources/${data.id}/refresh`)),
};
