import { GET, POST } from '@dbgpt/shared';

import type { createBenchmarkTaskRequest, getBenchmarkTaskListRequest } from '@/types/models_evaluation';

export interface BenchmarkEvaluationItem {
  evaluate_code: string;
  scene_key: string;
  scene_value: string;
  datasets_name?: string;
  evaluation_env?: string;
  model_list?: string[];
  state: string;
  log_info?: string | null;
  gmt_create?: string;
  gmt_modified?: string;
  round_time?: number;
}

export interface BenchmarkEvaluationData {
  items: BenchmarkEvaluationItem[];
  total_count: number;
  total_pages: number;
  page: number;
  page_size: number;
}

export interface BenchmarkDataset {
  dataset_id: string;
  name: string;
  tableCount: number;
}

export interface BenchmarkTableColumn {
  name: string;
  type: string;
}

export interface BenchmarkTableInfo {
  name: string;
  rowCount: number;
  columns: BenchmarkTableColumn[];
}

export type BenchmarkTableRow = Record<string, string | number | boolean | null>;

export interface BenchmarkTableData {
  table: string;
  limit: number;
  rows: BenchmarkTableRow[];
}

export interface BenchmarkSummary {
  roundId: number;
  llmCode: string;
  right: number;
  wrong: number;
  failed: number;
  exception: number;
  accuracy: number;
  execRate: number;
  outputPath: string;
}

export interface BenchmarkResultData {
  evaluate_code: string;
  scene_value: string;
  summaries: BenchmarkSummary[];
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const modelsEvaluationApi = {
  list: (params: getBenchmarkTaskListRequest) =>
    unwrap<BenchmarkEvaluationData>(GET('/api/v1/evaluate/benchmark_task_list', params)),
  create: (data: createBenchmarkTaskRequest) =>
    unwrap<Record<string, unknown>>(POST('/api/v1/evaluate/execute_benchmark_task', data)),
  datasets: () => unwrap<BenchmarkDataset[]>(GET('/api/v2/serve/evaluate/benchmark/list_datasets')),
  datasetTables: (datasetId: string) =>
    unwrap<BenchmarkTableInfo[]>(GET(`/api/v2/serve/evaluate/benchmark/dataset/${datasetId}`)),
  tableRows: (datasetId: string, table: string) =>
    unwrap<BenchmarkTableData>(GET(`/api/v2/serve/evaluate/benchmark/dataset/${datasetId}/${table}/rows`)),
  result: (evaluateCode: string) =>
    unwrap<BenchmarkResultData>(GET(`/api/v2/serve/evaluate/benchmark/result/${evaluateCode}`)),
};
