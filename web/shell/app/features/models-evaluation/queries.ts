import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { modelsEvaluationApi } from './api';
import { modelsEvaluationKeys } from './query-keys';
import type { createBenchmarkTaskRequest, getBenchmarkTaskListRequest } from '@/types/models_evaluation';

export function useBenchmarkTaskList(params: getBenchmarkTaskListRequest) {
  return useQuery({
    queryKey: modelsEvaluationKeys.list(params),
    queryFn: () => modelsEvaluationApi.list(params),
  });
}

export function useCreateBenchmarkTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: createBenchmarkTaskRequest) => modelsEvaluationApi.create(data),
    onSettled: () => qc.invalidateQueries({ queryKey: modelsEvaluationKeys.lists() }),
  });
}

export function useBenchmarkDatasets() {
  return useQuery({
    queryKey: modelsEvaluationKeys.datasets(),
    queryFn: modelsEvaluationApi.datasets,
  });
}

export function useBenchmarkTableRows(datasetId: string | null, table: string | null) {
  return useQuery({
    queryKey: datasetId && table ? modelsEvaluationKeys.tableRows(datasetId, table) : [...modelsEvaluationKeys.datasets(), 'rows-disabled'],
    queryFn: () => modelsEvaluationApi.tableRows(datasetId as string, table as string),
    enabled: !!datasetId && !!table,
  });
}

export function useBenchmarkResult(evaluateCode: string) {
  return useQuery({
    queryKey: modelsEvaluationKeys.result(evaluateCode),
    queryFn: () => modelsEvaluationApi.result(evaluateCode),
    enabled: !!evaluateCode,
  });
}
