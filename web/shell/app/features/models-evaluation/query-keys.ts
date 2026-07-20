import type { getBenchmarkTaskListRequest } from '@/types/models_evaluation';

export const modelsEvaluationKeys = {
  all: ['models-evaluation'] as const,
  lists: () => [...modelsEvaluationKeys.all, 'list'] as const,
  list: (params: getBenchmarkTaskListRequest) => [...modelsEvaluationKeys.lists(), params] as const,
  datasets: () => [...modelsEvaluationKeys.all, 'datasets'] as const,
  datasetTables: (datasetId: string) => [...modelsEvaluationKeys.datasets(), datasetId, 'tables'] as const,
  tableRows: (datasetId: string, table: string) =>
    [...modelsEvaluationKeys.datasets(), datasetId, 'tables', table, 'rows'] as const,
  result: (evaluateCode: string) => [...modelsEvaluationKeys.all, 'result', evaluateCode] as const,
};
