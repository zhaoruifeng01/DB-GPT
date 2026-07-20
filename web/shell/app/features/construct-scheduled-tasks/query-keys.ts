export const constructScheduledTasksKeys = {
  all: ['construct-scheduled-tasks'] as const,
  lists: () => [...constructScheduledTasksKeys.all, 'list'] as const,
  list: (enabledOnly = false) => [...constructScheduledTasksKeys.lists(), enabledOnly] as const,
  detail: (taskId?: string) => [...constructScheduledTasksKeys.all, 'detail', taskId ?? ''] as const,
  runs: (taskId?: string, limit = 50, offset = 0) =>
    [...constructScheduledTasksKeys.all, 'runs', taskId ?? '', limit, offset] as const,
};
