import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { evaluationApi, type CreateEvaluationPayload } from './api';
import { evaluationKeys } from './query-keys';
import type {
  delDataSetRequest,
  delEvaluationRequest,
  getDataSetsRequest,
  getEvaluationsRequest,
  getMetricsRequest,
  updateDataSetRequest,
  uploadDataSetsRequest,
} from '@/types/evaluate';

export function useEvaluationDatasets(params: getDataSetsRequest) {
  return useQuery({
    queryKey: evaluationKeys.datasets(params),
    queryFn: () => evaluationApi.datasets(params),
  });
}

export function useEvaluations(params: getEvaluationsRequest) {
  return useQuery({
    queryKey: evaluationKeys.evaluations(params),
    queryFn: () => evaluationApi.evaluations(params),
  });
}

export function useEvaluationMetrics(params: getMetricsRequest | null) {
  return useQuery({
    queryKey: params ? evaluationKeys.metrics(params) : [...evaluationKeys.all, 'metrics', 'disabled'],
    queryFn: () => evaluationApi.metrics(params as getMetricsRequest),
    enabled: !!params,
  });
}

export function useEvaluationStorageTypes() {
  return useQuery({
    queryKey: evaluationKeys.storageTypes(),
    queryFn: () => evaluationApi.storageTypes(),
  });
}

function useInvalidateEvaluation() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: evaluationKeys.all });
}

export function useCreateEvaluation() {
  const invalidate = useInvalidateEvaluation();
  return useMutation({
    mutationFn: (data: CreateEvaluationPayload) => evaluationApi.createEvaluation(data),
    onSettled: invalidate,
  });
}

export function useDeleteEvaluation() {
  const invalidate = useInvalidateEvaluation();
  return useMutation({
    mutationFn: (params: delEvaluationRequest) => evaluationApi.deleteEvaluation(params),
    onSettled: invalidate,
  });
}

export function useDeleteDataset() {
  const invalidate = useInvalidateEvaluation();
  return useMutation({
    mutationFn: (params: delDataSetRequest) => evaluationApi.deleteDataset(params),
    onSettled: invalidate,
  });
}

export function useUploadDatasetContent() {
  const invalidate = useInvalidateEvaluation();
  return useMutation({
    mutationFn: (data: uploadDataSetsRequest) => evaluationApi.uploadDatasetContent(data),
    onSettled: invalidate,
  });
}

export function useUploadDatasetFile() {
  const invalidate = useInvalidateEvaluation();
  return useMutation({
    mutationFn: (data: FormData) => evaluationApi.uploadDatasetFile(data),
    onSettled: invalidate,
  });
}

export function useUpdateDatasetMembers() {
  const invalidate = useInvalidateEvaluation();
  return useMutation({
    mutationFn: (data: updateDataSetRequest) => evaluationApi.updateDatasetMembers(data),
    onSettled: invalidate,
  });
}
