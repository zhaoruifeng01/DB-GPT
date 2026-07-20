import { ConnectorCard, ConnectorForm } from '@/new-components/connector';
import type {
  ConnectorCatalogEntry,
  ConnectorInstance,
  ConnectorStatus,
  CreateConnectorRequest,
} from '@/new-components/connector/types';
import { ApiOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Segmented, Spin, message } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConstructLayout from '~/components/construct/ConstructLayout';
import {
  useConnectorCatalog,
  useConnectorList,
  useConnectorToolsQuery,
  useCreateConnector,
  useDeleteConnector,
  useTestConnection,
  useUpdateConnector,
} from '~/features/construct-connectors/queries';

type StatusFilter = 'all' | 'active' | 'inactive' | 'attention';

type GridItem =
  | { kind: 'template'; template: ConnectorCatalogEntry; instanceCount: number }
  | { kind: 'instance'; instance: ConnectorInstance; catalogEntry?: ConnectorCatalogEntry };

const STATUS_ATTENTION_SET = new Set<ConnectorStatus>(['error', 'needs_reactivation']);

export default function ConnectorsPage() {
  const { t } = useTranslation();
  const { data: connectors = [], isFetching: loading } = useConnectorList();
  const { data: catalog = [], isFetching: catalogLoading } = useConnectorCatalog();
  const createConnector = useCreateConnector();
  const updateConnector = useUpdateConnector();
  const deleteConnector = useDeleteConnector();
  const testConnection = useTestConnection();

  const [formOpen, setFormOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<ConnectorInstance | undefined>(undefined);
  const [prefilledType, setPrefilledType] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const builtInTemplates = useMemo(() => catalog.filter(item => item.type !== 'custom_mcp'), [catalog]);

  const catalogByType = useMemo(() => {
    const map: Record<string, ConnectorCatalogEntry> = {};
    for (const entry of catalog) map[entry.type] = entry;
    return map;
  }, [catalog]);

  const instanceCountByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inst of connectors) {
      map[inst.connector_type] = (map[inst.connector_type] ?? 0) + 1;
    }
    return map;
  }, [connectors]);

  const gridItems: GridItem[] = useMemo(() => {
    const templateItems: GridItem[] = builtInTemplates
      .filter(item => (instanceCountByType[item.type] ?? 0) === 0)
      .map(item => ({
        kind: 'template',
        template: item,
        instanceCount: instanceCountByType[item.type] ?? 0,
      }));

    const instanceItems: GridItem[] = connectors.map(instance => ({
      kind: 'instance',
      instance,
      catalogEntry: catalogByType[instance.connector_type],
    }));

    return [...templateItems, ...instanceItems];
  }, [builtInTemplates, catalogByType, connectors, instanceCountByType]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return gridItems.filter(item => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'inactive') {
          if (item.kind !== 'template') return false;
        } else if (statusFilter === 'active') {
          if (item.kind !== 'instance' || item.instance.status !== 'active') return false;
        } else if (statusFilter === 'attention') {
          if (item.kind !== 'instance' || !STATUS_ATTENTION_SET.has(item.instance.status)) return false;
        }
      }

      if (!q) return true;
      if (item.kind === 'template') {
        return (
          item.template.display_name.toLowerCase().includes(q) ||
          item.template.type.toLowerCase().includes(q) ||
          (item.template.description ?? '').toLowerCase().includes(q)
        );
      }
      return item.instance.display_name.toLowerCase().includes(q) || item.instance.connector_type.toLowerCase().includes(q);
    });
  }, [gridItems, search, statusFilter]);

  const counters = useMemo(() => {
    const attentionCount = connectors.filter(item => STATUS_ATTENTION_SET.has(item.status)).length;
    return { attention: attentionCount };
  }, [connectors]);

  const handleAddConnector = () => {
    setEditingConnector(undefined);
    setPrefilledType(undefined);
    setFormOpen(true);
  };

  const handleActivateTemplate = (template: ConnectorCatalogEntry) => {
    setEditingConnector(undefined);
    setPrefilledType(template.type);
    setFormOpen(true);
  };

  const handleEdit = (connector: ConnectorInstance) => {
    setPrefilledType(undefined);
    setEditingConnector(connector);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConnector.mutateAsync(id);
      message.success(t('connector.msg.deleted'));
    } catch {
      message.error(t('connector.msg.deleteFailed'));
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testConnection.mutateAsync(id);
      if (result.success) {
        message.success(result.message || t('connector.msg.testSuccess'));
      } else {
        message.error(result.message || t('connector.msg.testFailed'));
      }
    } catch {
      message.error(t('connector.msg.testFailedCheck'));
    }
  };

  const handleSubmit = async (data: CreateConnectorRequest) => {
    try {
      if (editingConnector) {
        await updateConnector.mutateAsync({ id: editingConnector.id, data });
        message.success(t('connector.msg.updated'));
      } else {
        await createConnector.mutateAsync(data);
        message.success(t('connector.msg.created'));
      }
      setFormOpen(false);
      setEditingConnector(undefined);
      setPrefilledType(undefined);
    } catch {
      message.error(editingConnector ? t('connector.msg.updateFailed') : t('connector.msg.createFailed'));
    }
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingConnector(undefined);
    setPrefilledType(undefined);
  };

  const submitting = createConnector.isPending || updateConnector.isPending;
  const deleting = deleteConnector.isPending;
  const hasAnything = builtInTemplates.length > 0 || connectors.length > 0;
  const showEmptyFilter = hasAnything && visibleItems.length === 0;

  return (
    <ConstructLayout>
      <div className='relative h-dvh w-full overflow-y-auto bg-gradient-to-b from-[#f7f8fc] via-white to-[#f7f8fc] dark:from-[#1c2333] dark:via-[#1c2333] dark:to-[#161b29]'>
        <div className='max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8'>
          <div className='mb-7'>
            <div className='flex items-start justify-between gap-4 flex-wrap mb-2'>
              <div>
                <h1 className='text-[26px] leading-tight font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2.5'>
                  <span className='inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_4px_14px_-4px_rgba(124,58,237,0.5)]'>
                    <ApiOutlined className='text-lg' />
                  </span>
                  {t('connector.page.title')}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 ml-[46px]'>{t('connector.page.subtitle')}</p>
              </div>

              <Button
                className='border-none text-white bg-button-gradient h-9 px-4 shadow-[0_4px_14px_-4px_rgba(124,58,237,0.45)] hover:shadow-[0_6px_18px_-4px_rgba(124,58,237,0.6)] transition-shadow'
                icon={<ApiOutlined />}
                onClick={handleAddConnector}
                loading={submitting}
              >
                {t('connector.page.addBtn')}
              </Button>
            </div>
          </div>

          <div className='flex items-center gap-3 mb-6 flex-wrap'>
            <Input
              prefix={<SearchOutlined className='text-gray-400' />}
              placeholder={t('connector.page.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              className='w-[280px] h-[36px] backdrop-filter backdrop-blur-lg bg-white bg-opacity-60 border border-gray-200 rounded-lg dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
            />

            <Segmented
              value={statusFilter}
              onChange={value => setStatusFilter(value as StatusFilter)}
              options={[
                { label: t('connector.page.filterAll'), value: 'all' },
                { label: t('connector.page.filterActive'), value: 'active' },
                { label: t('connector.page.filterInactive'), value: 'inactive' },
                {
                  label: (
                    <span className='inline-flex items-center gap-1'>
                      {t('connector.page.filterAttention')}
                      {counters.attention > 0 && (
                        <span className='inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-medium bg-amber-500 text-white'>
                          {counters.attention}
                        </span>
                      )}
                    </span>
                  ),
                  value: 'attention',
                },
              ]}
              className='!bg-white/60 backdrop-blur-md rounded-lg dark:!bg-[#6f7f95]/40'
            />
          </div>

          <Spin spinning={loading || catalogLoading || deleting}>
            {!hasAnything && !loading && !catalogLoading ? (
              <EmptyState onAddCustom={handleAddConnector} />
            ) : showEmptyFilter ? (
              <FilterEmpty
                onReset={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              />
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-16'>
                {visibleItems.map(item =>
                  item.kind === 'template' ? (
                    <ConnectorCard
                      key={`tpl-${item.template.type}`}
                      kind='template'
                      template={item.template}
                      instanceCount={item.instanceCount}
                      onActivate={handleActivateTemplate}
                    />
                  ) : (
                    <ConnectorCard
                      key={`inst-${item.instance.id}`}
                      kind='instance'
                      connector={item.instance}
                      catalogEntry={item.catalogEntry}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTest={handleTest}
                      toolsQuery={useConnectorToolsQuery}
                    />
                  ),
                )}
              </div>
            )}
          </Spin>
        </div>

        <ConnectorForm
          open={formOpen}
          onClose={handleClose}
          onSubmit={handleSubmit}
          catalog={catalog}
          catalogLoading={catalogLoading}
          initialValues={editingConnector}
          prefilledType={prefilledType}
          submitting={submitting}
        />
      </div>
    </ConstructLayout>
  );
}

function EmptyState({ onAddCustom }: { onAddCustom: () => void }) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col items-center justify-center text-center py-24'>
      <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-5'>
        <ApiOutlined className='text-3xl text-violet-500' />
      </div>
      <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1'>{t('connector.page.emptyTitle')}</h3>
      <p className='text-sm text-gray-500 dark:text-gray-400 max-w-md mb-5'>{t('connector.page.emptyDesc')}</p>
      <Button type='primary' icon={<PlusOutlined />} className='border-none bg-button-gradient' onClick={onAddCustom}>
        {t('connector.page.addBtn')}
      </Button>
    </div>
  );
}

function FilterEmpty({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col items-center justify-center text-center py-20'>
      <SearchOutlined className='text-3xl text-gray-300 dark:text-gray-600 mb-3' />
      <p className='text-sm text-gray-500 dark:text-gray-400 mb-3'>{t('connector.page.filterEmptyText')}</p>
      <Button size='small' onClick={onReset}>
        {t('connector.page.filterEmptyReset')}
      </Button>
    </div>
  );
}
