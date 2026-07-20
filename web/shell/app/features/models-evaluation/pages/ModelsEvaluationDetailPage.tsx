import { Button, Card, Col, Descriptions, Row, Spin, Statistic, Table, Tabs } from 'antd';
import type { TableProps } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { MetricBars } from '~/features/models-evaluation/components/MetricBars';
import type { BenchmarkSummary } from '~/features/models-evaluation/api';
import { useBenchmarkResult } from '~/features/models-evaluation/queries';

export default function ModelsEvaluationDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { code = '' } = useParams();

  return (
    <div className='flex h-full w-full flex-col bg-gradient-light bg-cover bg-center px-6 py-2 pt-12 dark:bg-gradient-dark'>
      <Card
        title={
          <div className='flex justify-between'>
            <div className='flex items-center gap-2'>
              <span>{t('dataset_evaluation_detail')}</span>
              <Button type='link' onClick={() => navigate('/models_evaluation')}>
                {t('back_to_list')}
              </Button>
            </div>
            <div>
              <Button type='link' onClick={() => window.open('/models_evaluation/datasets', '_blank', 'noopener,noreferrer')}>
                {t('evaluation_dataset_info')}
              </Button>
              <Button
                type='link'
                target='_blank'
                rel='noopener noreferrer'
                href={`/api/v1/evaluate/benchmark_result_download?evaluate_code=${encodeURIComponent(code)}`}
              >
                {t('download_evaluation_result')}
              </Button>
            </div>
          </div>
        }
        className='flex h-full w-full flex-col [&_.ant-card-body]:overflow-y-auto'
      >
        <EvaluationDetailContent evaluateCode={code} />
      </Card>
    </div>
  );
}

function EvaluationDetailContent({ evaluateCode }: { evaluateCode: string }) {
  const { t } = useTranslation();
  const resultQuery = useBenchmarkResult(evaluateCode);
  const resultData = resultQuery.data;

  const totals = useMemo(() => {
    const summaries = resultData?.summaries ?? [];
    const right = summaries.reduce((sum, item) => sum + item.right, 0);
    const wrong = summaries.reduce((sum, item) => sum + item.wrong, 0);
    const failed = summaries.reduce((sum, item) => sum + item.failed, 0);
    const exception = summaries.reduce((sum, item) => sum + item.exception, 0);
    return {
      right,
      wrong,
      failed,
      exception,
      questions: right + wrong + failed + exception,
    };
  }, [resultData?.summaries]);

  const chartData = useMemo(
    () =>
      (resultData?.summaries ?? []).flatMap(item => [
        { name: t('executable_rate'), label: item.llmCode, value: item.execRate },
        { name: t('accuracy'), label: item.llmCode, value: item.accuracy },
      ]),
    [resultData?.summaries, t],
  );

  if (resultQuery.isFetching) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Spin size='large' />
      </div>
    );
  }

  if (resultQuery.isError) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-red-500'>{t('get_evaluation_result_failed')}</div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div>{t('no_data')}</div>
      </div>
    );
  }

  return (
    <>
      <Descriptions
        bordered
        items={[
          {
            key: '1',
            label: t('task_name'),
            children: resultData.scene_value,
          },
        ]}
      />
      <div className='mt-6'>
        <Row gutter={16} className='mb-4'>
          <Col span={4}>
            <Statistic title={t('model_count')} value={resultData.summaries?.length} className='rounded-lg border p-4' />
          </Col>
          <Col span={4}>
            <Statistic title={t('total_questions')} value={totals.questions} className='rounded-lg border p-4' />
          </Col>
          <Col span={4}>
            <Statistic title={t('correct_questions')} value={totals.right} className='rounded-lg border p-4' />
          </Col>
          <Col span={4}>
            <Statistic title={t('wrong_questions')} value={totals.wrong} className='rounded-lg border p-4' />
          </Col>
          <Col span={4}>
            <Statistic title={t('failed_questions')} value={totals.failed} className='rounded-lg border p-4' />
          </Col>
        </Row>
      </div>

      <ModelsTable data={resultData.summaries ?? []} />

      <Tabs items={[{ key: 'overview', label: t('overview'), children: <MetricBars data={chartData} /> }]} />
    </>
  );
}

function ModelsTable({ data }: { data: BenchmarkSummary[] }) {
  const { t } = useTranslation();

  const columns: TableProps<BenchmarkSummary>['columns'] = [
    { title: t('round'), dataIndex: 'roundId', width: '12.5%', key: 'roundId' },
    { title: t('model'), dataIndex: 'llmCode', width: '12.5%', key: 'llmCode' },
    {
      title: t('question_count'),
      width: '12.5%',
      key: 'total',
      render: (_, record) => record.right + record.wrong + record.failed,
    },
    { title: t('correct_questions'), dataIndex: 'right', width: '12.5%', key: 'right' },
    { title: t('wrong_questions'), dataIndex: 'wrong', width: '12.5%', key: 'wrong' },
    { title: t('failed_questions'), dataIndex: 'failed', width: '12.5%', key: 'failed' },
    {
      title: t('accuracy'),
      dataIndex: 'accuracy',
      width: '12.5%',
      key: 'accuracy',
      render: value => `${(Number(value) * 100).toFixed(2)}%`,
    },
    {
      title: t('executable_rate'),
      dataIndex: 'execRate',
      width: '12.5%',
      key: 'execRate',
      render: value => `${(Number(value) * 100).toFixed(2)}%`,
    },
  ];

  return <Table tableLayout='fixed' pagination={false} className='w-full' columns={columns} dataSource={data} />;
}
