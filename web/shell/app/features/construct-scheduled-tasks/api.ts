import { DELETE, GET, POST, PUT } from '@dbgpt/shared';

import type { RunResponse, TaskResponse, ToggleTaskRequest, UpdateTaskRequest } from '@/types/scheduled-task';

const BASE = '/api/v2/serve/scheduled-tasks';

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const constructScheduledTasksApi = {
  list: (enabledOnly = false) =>
    unwrap<TaskResponse[]>(GET(`${BASE}/`, { enabled_only: enabledOnly })).then(data => data ?? []),
  detail: (taskId: string) => unwrap<TaskResponse>(GET(`${BASE}/${taskId}`)),
  update: (taskId: string, body: UpdateTaskRequest) => unwrap<TaskResponse>(PUT(`${BASE}/${taskId}`, body)),
  toggle: (taskId: string, enabled: boolean) =>
    unwrap<TaskResponse>(POST<ToggleTaskRequest, TaskResponse>(`${BASE}/${taskId}/toggle`, { enabled })),
  remove: (taskId: string) => unwrap<unknown>(DELETE(`${BASE}/${taskId}`)),
  runs: (taskId: string, limit = 50, offset = 0) =>
    unwrap<RunResponse[]>(GET(`${BASE}/${taskId}/runs`, { limit, offset })).then(data => data ?? []),
};
