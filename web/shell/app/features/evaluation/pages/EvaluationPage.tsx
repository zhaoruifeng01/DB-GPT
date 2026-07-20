import { InfoCircleOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Upload,
  App,
} from 'antd';
import type { TableProps, UploadFile } from 'antd';
import type { valueType } from 'antd/es/statistic/utils';
import { useMemo, useState } from 'react';

import {
  evaluationApi,
  type DataSetItem,
  type DownloadResponse,
  type EvaluationDetailRow,
  type EvaluationItem,
} from '~/features/evaluation/api';
import {
  useCreateEvaluation,
  useDeleteDataset,
  useDeleteEvaluation,
  useEvaluationDatasets,
  useEvaluationMetrics,
  useEvaluations,
  useEvaluationStorageTypes,
  useUpdateDatasetMembers,
  useUploadDatasetContent,
  useUploadDatasetFile,
} from '~/features/evaluation/queries';

const { TextArea } = Input;
const { useWatch } = Form;

type TableKey = 'evaluations' | 'dataSet';

interface Option {
  label: string;
  value: string;
}

interface EvaluationFormValues {
  scene_key: 'recall' | 'app';
  scene_value: string;
  parallel_num: string | number;
  datasets: string;
  evaluate_metrics?: string;
}

interface DatasetFormValues {
  dataset_name: string;
  members?: string[];
  storage_type?: 'oss' | 'db';
  doc_file?: File;
  content?: string;
}

function asMembers(value: string[] | undefined): string {
  return value?.join(',') ?? '';
}

function formatStorageOptions(data: Awaited<ReturnType<typeof evaluationApi.storageTypes>> | undefined): Option[] {
  if (!data) {
    return [
      { label: 'oss', value: 'oss' },
      { label: 'db', value: 'db' },
    ];
  }

  const entries = Array.isArray(data)
    ? data.flatMap(item => Object.entries(item))
    : Object.entries(data);

  return entries.map(([value, label]) => ({
    value,
    label,
  }));
}

function headerValue(response: DownloadResponse, name: string): string {
  const value = response.headers[name];
  return typeof value === 'string' ? value : String(value ?? '');
}

function parseFilename(contentDisposition: string): string {
  if (!contentDisposition) return 'downloaded_file.xlsx';
  const match = contentDisposition.match(/filename\*?="?(.+)"?/);
  const raw = match?.[1];
  return raw ? decodeURIComponent(raw.replace(/^UTF-8''/, '')) : 'downloaded_file.xlsx';
}

async function readBlobError(blob: Blob): Promise<string | null> {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text) as { err_msg?: string };
    return parsed.err_msg ?? null;
  } catch {
    return null;
  }
}

async function downloadBlob(
  responsePromise: Promise<DownloadResponse>,
  showError: (content: string) => void,
) {
  const response = await responsePromise;
  const contentType = headerValue(response, 'content-type');
  if (contentType.includes('application/json')) {
    const errMsg = await readBlobError(response.data);
    showError(errMsg ?? '下载失败');
    return;
  }

  const url = window.URL.createObjectURL(
    new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = parseFilename(headerValue(response, 'content-disposition'));
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function EvaluationPage() {
  const { message } = App.useApp();
  const [currentTable, setCurrentTable] = useState<TableKey>('evaluations');
  const [evaluationPage, setEvaluationPage] = useState(1);
  const [datasetPage, setDatasetPage] = useState(1);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isAddDataset, setIsAddDataset] = useState(true);
  const [currentDatasetCode, setCurrentDatasetCode] = useState('');
  const [sceneValueOptions, setSceneValueOptions] = useState<Option[]>([]);
  const [sceneValueOptionLoading, setSceneValueOptionLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRows, setDetailRows] = useState<EvaluationDetailRow[]>([]);
  const [detailLoadingCode, setDetailLoadingCode] = useState('');
  const [downloadLoadingKey, setDownloadLoadingKey] = useState('');

  const [evaluationForm] = Form.useForm<EvaluationFormValues>();
  const [datasetForm] = Form.useForm<DatasetFormValues>();
  const selectedSceneKey = useWatch('scene_key', evaluationForm);
  const selectedSceneValue = useWatch('scene_value', evaluationForm);
  const selectedStorageType = useWatch('storage_type', datasetForm);

  const datasetsQuery = useEvaluationDatasets({ page: datasetPage, page_size: 10 });
  const evaluationsQuery = useEvaluations({ page: evaluationPage, page_size: 10 });
  const metricsQuery = useEvaluationMetrics(
    selectedSceneKey && selectedSceneValue
      ? {
          scene_key: selectedSceneKey,
          scene_value: selectedSceneValue,
        }
      : null,
  );
  const storageTypesQuery = useEvaluationStorageTypes();

  const createEvaluation = useCreateEvaluation();
  const deleteEvaluation = useDeleteEvaluation();
  const deleteDataset = useDeleteDataset();
  const uploadDatasetContent = useUploadDatasetContent();
  const uploadDatasetFile = useUploadDatasetFile();
  const updateDatasetMembers = useUpdateDatasetMembers();

  const datasetOptions = useMemo<Option[]>(
    () =>
      (datasetsQuery.data?.items ?? []).map(item => ({
        label: item.name,
        value: item.code,
      })),
    [datasetsQuery.data?.items],
  );

  const metricOptions = useMemo<Option[]>(
    () =>
      (metricsQuery.data ?? []).map(item => ({
        label: item.describe,
        value: item.name,
      })),
    [metricsQuery.data],
  );

  const storageTypeOptions = useMemo(() => formatStorageOptions(storageTypesQuery.data), [storageTypesQuery.data]);

  async function loadSceneOptions(sceneKey: EvaluationFormValues['scene_key']) {
    setSceneValueOptionLoading(true);
    evaluationForm.setFieldValue('scene_value', undefined);
    setSceneValueOptions([]);
    try {
      if (sceneKey === 'recall') {
        const spaces = await evaluationApi.spaces();
        setSceneValueOptions(spaces.map(space => ({ label: space.name, value: String(space.id) })));
      } else {
        const apps = await evaluationApi.apps();
        setSceneValueOptions(apps.app_list.map(app => ({ label: app.app_name, value: app.app_code })));
      }
    } finally {
      setSceneValueOptionLoading(false);
    }
  }

  async function handleCreateEvaluation() {
    const values = await evaluationForm.validateFields();
    await createEvaluation.mutateAsync({
      evaluate_code: '',
      context: '',
      user_name: '',
      user_id: '',
      sys_code: '',
      evaluate_metrics: values.evaluate_metrics ?? '',
      scene_key: values.scene_key,
      scene_value: values.scene_value,
      parallel_num: String(values.parallel_num),
      datasets: values.datasets,
    });
    message.success('发起成功');
    evaluationForm.resetFields();
    setIsEvaluationModalOpen(false);
  }

  async function handleSaveDataset() {
    const values = await datasetForm.validateFields();
    if (isAddDataset) {
      if (values.storage_type === 'oss') {
        if (!values.doc_file) {
          message.error('请选择文件');
          return;
        }
        const formData = new FormData();
        formData.append('dataset_name', values.dataset_name);
        formData.append('members', asMembers(values.members));
        formData.append('doc_file', values.doc_file, values.doc_file.name);
        await uploadDatasetFile.mutateAsync(formData);
      } else {
        await uploadDatasetContent.mutateAsync({
          dataset_name: values.dataset_name,
          members: asMembers(values.members),
          content: values.content ?? '',
        });
      }
      message.success('上传成功');
    } else {
      await updateDatasetMembers.mutateAsync({
        code: currentDatasetCode,
        members: asMembers(values.members),
      });
      message.success('更新成功');
    }

    datasetForm.resetFields();
    setIsDatasetModalOpen(false);
  }

  async function handleShowEvaluation(record: EvaluationItem) {
    setDetailLoadingCode(record.evaluate_code);
    try {
      const rows = await evaluationApi.detail({ evaluate_code: record.evaluate_code });
      if (rows.length) {
        setDetailRows(rows);
        setDetailOpen(true);
      }
    } finally {
      setDetailLoadingCode('');
    }
  }

  async function handleDatasetDownload(record: DataSetItem) {
    setDownloadLoadingKey(`dataset:${record.code}`);
    try {
      await downloadBlob(evaluationApi.downloadDataset({ code: record.code }), message.error);
    } finally {
      setDownloadLoadingKey('');
    }
  }

  async function handleEvaluationDownload(record: EvaluationItem) {
    setDownloadLoadingKey(`evaluation:${record.evaluate_code}`);
    try {
      await downloadBlob(evaluationApi.downloadEvaluation({ evaluate_code: record.evaluate_code }), message.error);
    } finally {
      setDownloadLoadingKey('');
    }
  }

  const datasetColumns: TableProps<DataSetItem>['columns'] = [
    { title: '名称', dataIndex: 'name', key: 'name', width: '10%', fixed: 'left' },
    { title: '编码', dataIndex: 'code', key: 'code', width: '20%' },
    { title: '储存方式', dataIndex: 'storage_type', key: 'storage_type' },
    { title: '数据集数量', dataIndex: 'datasets_count', key: 'datasets_count' },
    { title: '创建时间', dataIndex: 'gmt_create', key: 'gmt_create' },
    {
      title: '成员',
      dataIndex: 'members',
      key: 'members',
      width: '10%',
      render: value =>
        String(value ?? '')
          .split(',')
          .filter(Boolean)
          .map(item => <Tag key={item}>{item}</Tag>),
    },
    { title: '更新时间', dataIndex: 'gmt_modified', key: 'gmt_modified' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size='middle'>
          <Popconfirm
            title='确认删除吗'
            onConfirm={async () => {
              await deleteDataset.mutateAsync({ code: record.code });
              message.success('删除成功');
            }}
          >
            <Button type='link'>删除</Button>
          </Popconfirm>
          <Button
            type='link'
            onClick={() => {
              setIsAddDataset(false);
              setIsDatasetModalOpen(true);
              setCurrentDatasetCode(record.code);
              datasetForm.setFieldsValue({
                dataset_name: record.name,
                members: record.members?.split(',').filter(Boolean),
              });
            }}
          >
            编辑
          </Button>
          <Button
            type='link'
            loading={downloadLoadingKey === `dataset:${record.code}`}
            onClick={() => void handleDatasetDownload(record)}
          >
            下载
          </Button>
        </Space>
      ),
    },
  ];

  const evaluationColumns: TableProps<EvaluationItem>['columns'] = [
    {
      title: '数据集名称',
      dataIndex: 'datasets_name',
      key: 'datasets_name',
      fixed: 'left',
      width: '15%',
      render: text => <span className='block max-w-[300px] text-nowrap'>{text}</span>,
    },
    {
      title: '测评状态',
      dataIndex: 'state',
      key: 'state',
      render: text => <Badge style={{ textWrap: 'nowrap' }} status={text === 'failed' ? 'error' : 'success'} text={text} />,
    },
    { title: '测评编码', dataIndex: 'evaluate_code', key: 'evaluate_code' },
    { title: '场景', dataIndex: 'scene_key', key: 'scene_key' },
    { title: '测评指标', dataIndex: 'evaluate_metrics', key: 'evaluate_metrics' },
    { title: '创建时间', dataIndex: 'gmt_create', key: 'gmt_create' },
    { title: '更新时间', dataIndex: 'gmt_modified', key: 'gmt_modified' },
    Table.EXPAND_COLUMN,
    {
      title: (
        <span className='w-[50px]'>
          <span className='text-nowrap'>详情</span>
          <Tooltip placement='topLeft' title='查看日志与评分'>
            <InfoCircleOutlined />
          </Tooltip>
        </span>
      ),
      render: () => <div className='min-w-[50px]' />,
    },
    {
      title: '测评结果',
      key: 'result',
      render: (_, record) => (
        <>
          <Button
            type='link'
            loading={detailLoadingCode === record.evaluate_code}
            onClick={() => void handleShowEvaluation(record)}
          >
            评分明细
          </Button>
          <Button
            type='link'
            loading={downloadLoadingKey === `evaluation:${record.evaluate_code}`}
            onClick={() => void handleEvaluationDownload(record)}
          >
            下载
          </Button>
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '25%',
      render: (_, record) => (
        <Popconfirm
          title='确认删除吗'
          onConfirm={async () => {
            await deleteEvaluation.mutateAsync({ evaluation_code: record.evaluate_code });
            message.success('删除成功');
          }}
        >
          <Button type='link'>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Segmented: {
            itemSelectedBg: '#2867f5',
            itemSelectedColor: 'white',
          },
        },
      }}
    >
      <div className='flex h-full w-full flex-col bg-gradient-light bg-cover bg-center dark:bg-gradient-dark'>
        <div className='overflow-y-auto px-6 py-2'>
          <Segmented
            className='backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 border-2 border-white rounded-lg shadow p-1 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
            options={[
              { label: '评测数据', value: 'evaluations' },
              { label: '数据集', value: 'dataSet' },
            ]}
            onChange={type => setCurrentTable(type as TableKey)}
            value={currentTable}
          />

          {currentTable === 'dataSet' && (
            <>
              <div className='mb-4 flex flex-row-reverse'>
                <Button
                  className='h-full border-none text-white bg-button-gradient'
                  onClick={() => {
                    setIsAddDataset(true);
                    datasetForm.resetFields();
                    setIsDatasetModalOpen(true);
                  }}
                >
                  添加数据集
                </Button>
              </div>
              <Table
                pagination={{
                  total: datasetsQuery.data?.total_count ?? 0,
                  current: datasetPage,
                  onChange: page => setDatasetPage(page),
                }}
                scroll={{ x: 1300 }}
                loading={datasetsQuery.isFetching || deleteDataset.isPending}
                columns={datasetColumns}
                dataSource={datasetsQuery.data?.items ?? []}
                rowKey='code'
              />
            </>
          )}

          {currentTable === 'evaluations' && (
            <>
              <div className='mb-4 flex flex-row-reverse'>
                <Button
                  className='h-full border-none text-white bg-button-gradient'
                  onClick={() => setIsEvaluationModalOpen(true)}
                >
                  发起评测
                </Button>
              </div>
              <Table
                pagination={{
                  total: evaluationsQuery.data?.total_count ?? 0,
                  current: evaluationPage,
                  onChange: page => setEvaluationPage(page),
                }}
                rowKey='evaluate_code'
                expandable={{
                  expandedRowRender: ({ average_score, log_info }) => (
                    <div className='flex flex-col gap-2'>
                      {(() => {
                        if (!average_score) return null;
                        try {
                          const scores = JSON.parse(average_score) as Record<string, valueType>;
                          return (
                            <div className='flex flex-row gap-1'>
                              {Object.entries(scores).map(([key, value]) => (
                                <Statistic title={key} key={key} value={value} />
                              ))}
                            </div>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                      {log_info && (
                        <div>
                          <span className='text-sm text-gray-500'>log：</span>
                          <span>{log_info}</span>
                        </div>
                      )}
                    </div>
                  ),
                }}
                scroll={{ x: '100%' }}
                loading={evaluationsQuery.isFetching || deleteEvaluation.isPending}
                columns={evaluationColumns}
                dataSource={evaluationsQuery.data?.items ?? []}
              />
            </>
          )}

          <Modal
            title='发起测评'
            open={isEvaluationModalOpen}
            onOk={() => void handleCreateEvaluation()}
            confirmLoading={createEvaluation.isPending}
            onCancel={() => setIsEvaluationModalOpen(false)}
          >
            <Form
              name='evaluation-form'
              form={evaluationForm}
              initialValues={{ parallel_num: 1 }}
              autoComplete='off'
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Form.Item name='scene_key' label='场景类型' rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'recall', label: 'recall' },
                    { value: 'app', label: 'app' },
                  ]}
                  onChange={value => void loadSceneOptions(value)}
                />
              </Form.Item>
              <Form.Item name='scene_value' label='场景参数' rules={[{ required: true }]}>
                <Select loading={sceneValueOptionLoading} disabled={sceneValueOptionLoading} options={sceneValueOptions} />
              </Form.Item>
              <Form.Item name='parallel_num' label='并行参数' rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name='datasets' label='数据集' rules={[{ required: true }]}>
                <Select options={datasetOptions} />
              </Form.Item>
              <Form.Item name='evaluate_metrics' label='评测指标' rules={[{ required: selectedSceneKey === 'app' }]}>
                <Select loading={metricsQuery.isFetching} disabled={metricsQuery.isFetching} options={metricOptions} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={isAddDataset ? '添加数据集' : '编辑数据集'}
            open={isDatasetModalOpen}
            confirmLoading={uploadDatasetContent.isPending || uploadDatasetFile.isPending || updateDatasetMembers.isPending}
            onOk={() => void handleSaveDataset()}
            onCancel={() => setIsDatasetModalOpen(false)}
          >
            <Form
              name='dataset-form'
              form={datasetForm}
              autoComplete='off'
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Form.Item name='dataset_name' label='名称' rules={[{ required: true }]}>
                <Input disabled={!isAddDataset} />
              </Form.Item>
              <Form.Item name='members' label='成员'>
                <Select mode='tags' />
              </Form.Item>
              {isAddDataset && (
                <Form.Item name='storage_type' label='储存类型' rules={[{ required: true }]}>
                  <Select options={storageTypeOptions} loading={storageTypesQuery.isFetching} />
                </Form.Item>
              )}
              {selectedStorageType === 'oss' && isAddDataset && (
                <Form.Item
                  name='doc_file'
                  label='doc_file'
                  rules={[{ required: true }]}
                  getValueFromEvent={(event: { fileList?: UploadFile[] }) =>
                    event.fileList?.[0]?.originFileObj as File | undefined
                  }
                >
                  <Upload name='dataSet' maxCount={1} beforeUpload={() => false}>
                    <Button icon={<UploadOutlined />}>Click to Upload</Button>
                  </Upload>
                </Form.Item>
              )}
              {selectedStorageType === 'db' && isAddDataset && (
                <Form.Item name='content' label='content' rules={[{ required: true }]}>
                  <TextArea rows={8} />
                </Form.Item>
              )}
            </Form>
          </Modal>

          <Modal
            title='评分明细'
            open={detailOpen}
            onOk={() => setDetailOpen(false)}
            onCancel={() => setDetailOpen(false)}
            styles={{
              body: {
                maxHeight: '500px',
                overflowY: 'auto',
                minWidth: '700px',
              },
            }}
            style={{ minWidth: '750px' }}
            footer={[
              <Button key='back' onClick={() => setDetailOpen(false)}>
                返回
              </Button>,
            ]}
          >
            <Table
              columns={Object.keys(detailRows[0] ?? {}).map(key => ({
                title: key,
                dataIndex: key,
                key,
              }))}
              style={{ minWidth: '700px' }}
              dataSource={detailRows}
              rowKey={(record, index) => `${record.code ?? 'row'}-${index ?? 0}`}
              pagination={false}
            />
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
}
