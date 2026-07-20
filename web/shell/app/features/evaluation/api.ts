import { DELETE, GET, POST, getApi } from '@dbgpt/shared';
import type { AxiosResponse } from 'axios';

import type {
  createEvaluationsRequest,
  delDataSetRequest,
  delEvaluationRequest,
  downloadEvaluationRequest,
  getDataSetsRequest,
  getEvaluationsRequest,
  getMetricsRequest,
  updateDataSetRequest,
  uploadDataSetsRequest,
} from '@/types/evaluate';
import type { AppListResponse } from '@/types/app';
import type { ISpace } from '@/types/knowledge';

export interface DataSetItem {
  code: string;
  name: string;
  file_type: string;
  storage_type: string;
  storage_position: string;
  datasets_count: string;
  have_answer: boolean;
  members: string;
  user_name: string;
  user_id: string;
  sys_code: string;
  gmt_create: string;
  gmt_modified: string;
}

export interface EvaluationItem {
  evaluate_code: string;
  datasets_name?: string;
  scene_key: string;
  scene_value: string;
  datasets: string;
  evaluate_metrics: string;
  context: Record<string, unknown> | string;
  user_name: string;
  user_id: string;
  sys_code: string;
  parallel_num: string;
  state: string;
  result: string;
  average_score: string;
  log_info: string;
  gmt_create: string;
  gmt_modified: string;
}

export interface PageResult<T> {
  items: T[];
  total_count: number;
}

export interface MetricItem {
  name: string;
  describe: string;
}

export type CreateEvaluationPayload = createEvaluationsRequest & {
  parallel_num: string;
};

export type EvaluationDetailRow = Record<string, string | number | boolean | null>;
export type StorageTypesResponse = Record<string, string>[] | Record<string, string>;
export type DownloadResponse = AxiosResponse<Blob>;

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const evaluationApi = {
  datasets: (params: getDataSetsRequest) =>
    unwrap<PageResult<DataSetItem>>(GET('/api/v1/evaluate/datasets', params)),
  evaluations: (params: getEvaluationsRequest) =>
    unwrap<PageResult<EvaluationItem>>(GET('/api/v1/evaluate/evaluations', params)),
  metrics: (params: getMetricsRequest) => unwrap<MetricItem[]>(GET('/api/v1/evaluate/metrics', params)),
  detail: (params: Partial<createEvaluationsRequest>) =>
    unwrap<EvaluationDetailRow[]>(GET('/api/v1/evaluate/evaluation/detail/show', params)),
  storageTypes: () => unwrap<StorageTypesResponse>(GET('/api/v1/evaluate/storage/types')),
  spaces: () => unwrap<ISpace[]>(POST('/knowledge/space/list', {})),
  apps: () => unwrap<AppListResponse>(POST('/api/v1/app/list?page=1&page_size=1000', {})),
  createEvaluation: (data: CreateEvaluationPayload) =>
    unwrap<Record<string, unknown>>(POST('/api/v1/evaluate/start', data)),
  deleteEvaluation: (params: delEvaluationRequest) =>
    unwrap<Record<string, unknown>>(DELETE('/api/v1/evaluate/evaluation', params)),
  deleteDataset: (params: delDataSetRequest) =>
    unwrap<Record<string, unknown>>(DELETE('/api/v1/evaluate/dataset', params)),
  uploadDatasetContent: (data: uploadDataSetsRequest) =>
    unwrap<Record<string, unknown>>(POST('/api/v1/evaluate/dataset/upload/content', data)),
  uploadDatasetFile: (data: FormData) =>
    unwrap<Record<string, unknown>>(
      POST('/api/v1/evaluate/dataset/upload/file', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    ),
  updateDatasetMembers: (data: updateDataSetRequest) =>
    unwrap<Record<string, unknown>>(POST('/api/v1/evaluate/dataset/members/update', data)),
  downloadDataset: (params: delDataSetRequest) =>
    getApi().get<Blob>('/api/v1/evaluate/dataset/download', { params, responseType: 'blob' }) as Promise<DownloadResponse>,
  downloadEvaluation: (params: downloadEvaluationRequest) =>
    getApi().get<Blob>('/api/v1/evaluate/evaluation/result/download', {
      params,
      responseType: 'blob',
    }) as Promise<DownloadResponse>,
};
