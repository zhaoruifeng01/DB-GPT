import { ReloadOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Segmented, Table, Tag, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { NewBenchmarkTaskModal } from '~/features/models-evaluation/components/NewBenchmarkTaskModal';
import type { BenchmarkEvaluationItem } from '~/features/models-evaluation/api';
import { useBenchmarkTaskList } from '~/features/models-evaluation/queries';
import type { TabKey } from '@/types/models_evaluation';

export default function ModelsEvaluationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<TabKey>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);

  const listParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      sys_code: activeKey === 'all' ? undefined : activeKey,
    }),
    [activeKey, page, pageSize],
  );
  const listQuery = useBenchmarkTaskList(listParams);

  const columns: TableProps<BenchmarkEvaluationItem>['columns'] = [
    { title: t('evaluation_scene'), dataIndex: 'scene_key', key: 'scene_key', width: '5%' },
    { title: t('task_name'), dataIndex: 'scene_value', key: 'scene_value', width: '12%' },
    {
      title: t('evaluation_env'),
      dataIndex: 'evaluation_env',
      key: 'evaluation_env',
      width: '5%',
      render: evaluationEnv => {
        if (evaluationEnv === 'DEV') return <span>{t('evaluation_env_dev')}</span>;
        if (evaluationEnv === 'TEST') return <span>{t('evaluation_env_test')}</span>;
        return <span>{evaluationEnv}</span>;
      },
    },
    {
      title: t('evaluation_dataset_name'),
      dataIndex: 'datasets_name',
      key: 'datasets_name',
      width: '6%',
      render: datasetsName => (
        <Tooltip title={datasetsName}>
          <p className='truncate'>{datasetsName}</p>
        </Tooltip>
      ),
    },
    { title: t('create_time'), dataIndex: 'gmt_create', key: 'gmt_create', width: '10%' },
    { title: t('finish_time'), dataIndex: 'gmt_modified', key: 'gmt_modified', width: '10%' },
    {
      title: t('model_name'),
      dataIndex: 'model_list',
      key: 'model_list',
      width: '10%',
      render: modelList => <span>{Array.isArray(modelList) ? modelList.join(',') : ''}</span>,
    },
    {
      title: t('task_status'),
      dataIndex: 'state',
      key: 'state',
      width: '5%',
      render: (state, record) => {
        const map: Record<string, { color: string; text: string }> = {
          running: { color: 'blue', text: '运行中' },
          complete: { color: 'green', text: '已完成' },
          failed: { color: 'red', text: '失败' },
          pending: { color: 'orange', text: '待处理' },
        };
        const meta = map[String(state)] ?? { color: 'default', text: String(state ?? '') };
        const tag = <Tag color={meta.color}>{meta.text}</Tag>;
        return record.state === 'failed' ? <Tooltip title={record.log_info}>{tag}</Tooltip> : tag;
      },
    },
    { title: t('round_time'), dataIndex: 'round_time', key: 'round_time', width: '5%' },
    {
      title: t('operator'),
      width: '6%',
      key: 'action',
      render: (_, record) => (
        <Button
          type='link'
          disabled={record.state !== 'complete'}
          onClick={() => navigate(`/models_evaluation/${record.evaluate_code}`)}
        >
          {t('View_details')}
        </Button>
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
      <div className='flex h-full w-full flex-col bg-gradient-light bg-cover bg-center px-6 py-2 pt-12 dark:bg-gradient-dark'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Segmented
              className='backdrop-filter h-10 backdrop-blur-lg bg-white bg-opacity-30 border border-white rounded-lg shadow p-1 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
              options={[{ value: 'all' as const, label: t('all_models_evaluation') }]}
              onChange={value => {
                setActiveKey(value as TabKey);
                setPage(1);
              }}
              value={activeKey}
            />
          </div>
          <div>
            <Tooltip title={t('refresh_list')}>
              <ReloadOutlined onClick={() => void listQuery.refetch()} className='cursor-pointer p-2' />
            </Tooltip>
            <Button
              className='m-2 h-full border-none text-white bg-button-gradient'
              type='primary'
              onClick={() => window.open('/models_evaluation/datasets', '_blank', 'noopener,noreferrer')}
            >
              {t('evaluation_dataset_info')}
            </Button>
            <Button className='h-full border-none text-white bg-button-gradient' onClick={() => setModalOpen(true)}>
              {t('create_evaluation')}
            </Button>
          </div>
        </div>
        <div className='flex h-full w-full flex-col overflow-y-auto'>
          <Table
            tableLayout='fixed'
            className='w-full'
            pagination={{
              total: listQuery.data?.total_count || 0,
              current: listQuery.data?.page || page,
              pageSize: listQuery.data?.page_size || pageSize,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            loading={listQuery.isFetching}
            columns={columns}
            dataSource={listQuery.data?.items || []}
            rowKey='evaluate_code'
          />
        </div>
        <NewBenchmarkTaskModal open={modalOpen} onCancel={() => setModalOpen(false)} />
      </div>
    </ConfigProvider>
  );
}
