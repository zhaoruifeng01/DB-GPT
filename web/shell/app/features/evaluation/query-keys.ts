import type { getDataSetsRequest, getEvaluationsRequest, getMetricsRequest } from '@/types/evaluate';

export const evaluationKeys = {
  all: ['evaluation'] as const,
  datasets: (params: getDataSetsRequest) => [...evaluationKeys.all, 'datasets', params] as const,
  evaluations: (params: getEvaluationsRequest) => [...evaluationKeys.all, 'evaluations', params] as const,
  metrics: (params: getMetricsRequest) => [...evaluationKeys.all, 'metrics', params] as const,
  storageTypes: () => [...evaluationKeys.all, 'storage-types'] as const,
};
