import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateTaskRequest } from '@/types/scheduled-task';
import { constructScheduledTasksApi } from './api';
import { constructScheduledTasksKeys } from './query-keys';

export function useScheduledTasks(enabledOnly = false) {
  return useQuery({
    queryKey: constructScheduledTasksKeys.list(enabledOnly),
    queryFn: () => constructScheduledTasksApi.list(enabledOnly),
  });
}

export function useScheduledTaskDetail(taskId?: string) {
  return useQuery({
    queryKey: constructScheduledTasksKeys.detail(taskId),
    queryFn: () => constructScheduledTasksApi.detail(taskId ?? ''),
    enabled: Boolean(taskId),
  });
}

export function useTaskRuns(taskId?: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: constructScheduledTasksKeys.runs(taskId, limit, offset),
    queryFn: () => constructScheduledTasksApi.runs(taskId ?? '', limit, offset),
    enabled: Boolean(taskId),
  });
}

function useInvalidateScheduledTasks() {
  const qc = useQueryClient();
  return (taskId?: string) => {
    void qc.invalidateQueries({ queryKey: constructScheduledTasksKeys.lists() });
    if (taskId) {
      void qc.invalidateQueries({ queryKey: constructScheduledTasksKeys.detail(taskId) });
      void qc.invalidateQueries({ queryKey: [...constructScheduledTasksKeys.all, 'runs', taskId] });
    }
  };
}

export function useUpdateScheduledTask() {
  const invalidate = useInvalidateScheduledTasks();
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: UpdateTaskRequest }) =>
      constructScheduledTasksApi.update(taskId, body),
    onSettled: (_data, _error, variables) => invalidate(variables.taskId),
  });
}

export function useToggleScheduledTask() {
  const invalidate = useInvalidateScheduledTasks();
  return useMutation({
    mutationFn: ({ taskId, enabled }: { taskId: string; enabled: boolean }) =>
      constructScheduledTasksApi.toggle(taskId, enabled),
    onSettled: (_data, _error, variables) => invalidate(variables.taskId),
  });
}

export function useDeleteScheduledTask() {
  const invalidate = useInvalidateScheduledTasks();
  return useMutation({
    mutationFn: (taskId: string) => constructScheduledTasksApi.remove(taskId),
    onSettled: (_data, _error, taskId) => invalidate(taskId),
  });
}
