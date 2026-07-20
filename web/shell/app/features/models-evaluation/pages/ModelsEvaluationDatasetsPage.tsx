import { Card, Spin, Table, Tree, Typography } from 'antd';
import type { TableProps, TreeDataNode } from 'antd';
import type { Key } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

import type { BenchmarkTableInfo, BenchmarkTableRow } from '~/features/models-evaluation/api';
import { modelsEvaluationApi } from '~/features/models-evaluation/api';
import { modelsEvaluationKeys } from '~/features/models-evaluation/query-keys';
import { useBenchmarkDatasets, useBenchmarkTableRows } from '~/features/models-evaluation/queries';

const { Title, Text } = Typography;

type DatasetTreeNode = TreeDataNode & {
  parent?: string;
};

function updateTreeData(list: DatasetTreeNode[], key: Key, children: DatasetTreeNode[]): DatasetTreeNode[] {
  return list.map(node => {
    if (node.key === key) {
      return { ...node, children };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children as DatasetTreeNode[], key, children),
      };
    }
    return node;
  });
}

export default function ModelsEvaluationDatasetsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<DatasetTreeNode[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const datasetsQuery = useBenchmarkDatasets();
  const tableRowsQuery = useBenchmarkTableRows(selectedDataset, selectedTable);

  useEffect(() => {
    const datasets = datasetsQuery.data ?? [];
    setTreeData(
      datasets.map(item => ({
        title: `${item.name}(${item.tableCount} ${t('tables')})`,
        key: item.dataset_id,
        selectable: false,
      })),
    );
    setSelectedDataset(prev => {
      if (prev && datasets.some(item => item.dataset_id === prev)) return prev;
      return datasets[0]?.dataset_id ?? null;
    });
  }, [datasetsQuery.data, t]);

  async function loadTreeData({ key, children }: DatasetTreeNode) {
    if (children) return;
    setTablesLoading(true);
    try {
      const datasetId = String(key);
      const tables = await qc.fetchQuery({
        queryKey: modelsEvaluationKeys.datasetTables(datasetId),
        queryFn: () => modelsEvaluationApi.datasetTables(datasetId),
      });
      setTreeData(prev =>
        updateTreeData(
          prev,
          key,
          tables.map((item: BenchmarkTableInfo) => ({
            title: item.name,
            key: item.name,
            parent: datasetId,
            isLeaf: true,
          })),
        ),
      );
    } finally {
      setTablesLoading(false);
    }
  }

  function onTableSelected(selectedKeys: Key[], info: { selectedNodes: DatasetTreeNode[] }) {
    setSelectedDataset(info.selectedNodes[0]?.parent ?? null);
    setSelectedTable(selectedKeys[0] ? String(selectedKeys[0]) : null);
  }

  const columns: TableProps<BenchmarkTableRow>['columns'] = useMemo(() => {
    const firstRow = tableRowsQuery.data?.rows?.[0];
    if (!firstRow) return [];
    return Object.keys(firstRow).map((key, index) => ({
      title: key,
      dataIndex: key,
      key,
      width: index === 0 ? 100 : undefined,
    }));
  }, [tableRowsQuery.data?.rows]);

  return (
    <div className='h-full w-full bg-gradient-light bg-cover bg-center px-6 py-2 pt-12 dark:bg-gradient-dark'>
      <Card
        title={
          <div className='flex items-center justify-between'>
            <span>{t('evaluation_datasets')}</span>
            <button type='button' className='text-sm text-[#2867f5]' onClick={() => navigate('/models_evaluation')}>
              {t('back_to_evaluation_task_list')}
            </button>
          </div>
        }
        className='flex h-full w-full flex-1 flex-col [&_.ant-card-body]:h-full [&_.ant-card-body]:overflow-hidden'
      >
        <div className='flex h-full'>
          <div className='flex w-1/4 flex-col border-r pr-4'>
            <Title level={5} className='mb-4'>
              {t('dataset_list')}
            </Title>
            <div className='h-full overflow-y-auto'>
              <Spin spinning={datasetsQuery.isFetching || tablesLoading}>
                <Tree loadData={loadTreeData} treeData={treeData} onSelect={onTableSelected} />
              </Spin>
            </div>
          </div>

          <div className='flex w-3/4 flex-col pl-4'>
            <div className='mb-4 flex items-center justify-between'>
              <Title level={5} className='mb-0'>
                {t('table_data')}
                <span className='text-sm font-normal'>{t('only_show_first_10_data')}</span>
              </Title>
              {selectedTable && <Text type='secondary'>{selectedTable}</Text>}
            </div>
            <div className='h-full overflow-y-auto'>
              {tableRowsQuery.isFetching ? (
                <div className='flex h-full items-center justify-center'>
                  <Spin />
                </div>
              ) : tableRowsQuery.data && tableRowsQuery.data.rows.length > 0 ? (
                <Table
                  className='w-full flex-auto'
                  dataSource={tableRowsQuery.data.rows}
                  columns={columns}
                  pagination={false}
                  scroll={{ x: true }}
                  size='small'
                  rowKey={(_, index) => String(index ?? 0)}
                />
              ) : selectedTable ? (
                <Text type='secondary'>{t('no_data')}</Text>
              ) : (
                <Text type='secondary'>{t('please_select_a_table_first')}</Text>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
