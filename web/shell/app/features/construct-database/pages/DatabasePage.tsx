import GPTCard from '@/components/common/gpt-card';
import MuiLoading from '@/components/common/loading';
import FormDialog from '@/components/database/form-dialog';
import type { DBOption, DBType, DbListResponse } from '@/types/db';
import { dbMapper } from '@/utils';
import { DeleteFilled, EditFilled, PlusOutlined, RedoOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Drawer, Empty, Modal, Spin, message } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConstructLayout from '~/components/construct/ConstructLayout';
import {
  useDatabaseList,
  useDatabaseSupportTypes,
  useDeleteDatabase,
  useRefreshDatabase,
} from '~/features/construct-database/queries';

type DBItem = DbListResponse[0];
type DbParams = Record<string, string | number | undefined>;

function getDbParams(item: DBItem): DbParams {
  return (item.params || {}) as unknown as DbParams;
}

function getDatasourceName(item: DBItem) {
  const params = getDbParams(item);
  return String(params.database || params.project || params.path || item.db_name || '');
}

export function isFileDb(dbTypeList: DBOption[], dbType: DBType) {
  return dbTypeList.find(item => item.value === dbType)?.isFileDb;
}

let getFromRenderData: NonNullable<DBOption['parameters']> = [];

export default function DatabasePage() {
  const { t } = useTranslation();
  const { data: dbList = [], isFetching: dbLoading, refetch: refetchDbList } = useDatabaseList();
  const { data: dbSupportList = [] } = useDatabaseSupportTypes();
  const deleteDatabase = useDeleteDatabase();
  const refreshDatabase = useRefreshDatabase();
  const [modal, setModal] = useState<{
    open: boolean;
    info?: string;
    dbType?: DBType;
    dbTypeData?: DBOption[];
    description?: string;
  }>({ open: false });
  const [draw, setDraw] = useState<{
    open: boolean;
    dbList?: DbListResponse;
    name?: string;
    type?: DBType;
  }>({ open: false });

  const dbTypeList = useMemo(() => {
    const uniqueSupportDbList = Array.from(new Map(dbSupportList.map(item => [item?.name, item])).values());
    const supportDbList = uniqueSupportDbList
      .filter(item => Boolean(dbMapper[item?.name as DBType]))
      .map(item => {
        const dbType = item?.name as DBType;
        const mapper = dbMapper[dbType];

        return {
          ...mapper,
          value: dbType,
          isFileDb: true,
          parameters: item.parameters,
        };
      }) as DBOption[];
    const unSupportDbList = Object.keys(dbMapper)
      .filter(item => !supportDbList.some(db => db.value === item))
      .map(item => ({
        ...dbMapper[item],
        value: item as DBType,
        disabled: true,
      })) as DBOption[];
    return [...supportDbList, ...unSupportDbList];
  }, [dbSupportList]);

  const onModify = (item: DBItem) => {
    const params = getDbParams(item);
    for (const element of getFromRenderData) {
      const value = params[element.param_name];
      if (value !== undefined) {
        element.default_value = value;
      }
    }
    setModal({ open: true, info: item.id, dbType: item.type, description: item.description });
  };

  const onDelete = (item: DBItem) => {
    Modal.confirm({
      title: 'Tips',
      content: `你确定要删除这个数据库连接吗`,
      async onOk() {
        try {
          await deleteDatabase.mutateAsync(item.id);
          message.success('success');
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Delete failed');
          throw err;
        }
      },
    });
  };

  const dbListByType = useMemo(() => {
    const mapper = dbTypeList.reduce(
      (acc, item) => {
        acc[item.value] = dbList.filter(dbConn => dbConn?.type.toLowerCase() === item.value.toLowerCase());
        return acc;
      },
      {} as Record<DBType, DbListResponse>,
    );
    return mapper;
  }, [dbList, dbTypeList]);

  const handleDbTypeClick = (info: DBOption) => {
    const dbItems = dbList.filter(item => item.type === info.value);
    getFromRenderData = info?.parameters || [];

    setDraw({
      open: true,
      dbList: dbItems,
      name: info.label,
      type: info.value,
    });
  };

  const onRefresh = async (item: DBItem) => {
    const res = await refreshDatabase.mutateAsync(item.id);
    if (res) message.success(t('refreshSuccess'));
  };

  const getFileName = (path: string) => {
    if (!path) return '';
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] ?? '';
  };
  const activeDbList = draw.type ? dbListByType[draw.type] || [] : [];

  return (
    <ConstructLayout>
      <div className='relative min-h-full overflow-y-auto px-6 max-h-[90vh]'>
        <MuiLoading visible={dbLoading} />
        <div className='flex justify-between items-center mb-6'>
          <div className='flex items-center gap-4' />

          <div className='flex items-center gap-4'>
            <Button
              className='border-none text-white bg-button-gradient'
              icon={<PlusOutlined />}
              onClick={() => setModal({ open: true, dbTypeData: dbTypeList })}
            >
              {t('Add_Datasource')}
            </Button>
          </div>
        </div>

        <div className='flex flex-wrap mx-[-8px] gap-2 md:gap-4'>
          {dbTypeList.map(item => (
            <Badge key={item.value} count={dbListByType[item.value]?.length} className='min-h-fit'>
              <GPTCard
                className='h-full'
                title={item.label}
                desc={item.desc ?? ''}
                disabled={item.disabled}
                icon={item.icon}
                onClick={() => {
                  if (item.disabled) return;
                  handleDbTypeClick(item);
                }}
              />
            </Badge>
          ))}
        </div>
        <FormDialog
          open={modal.open}
          dbTypeList={dbTypeList}
          getFromRenderData={getFromRenderData}
          description={modal.description}
          choiceDBType={modal.dbType}
          editValue={modal.info}
          dbTypeData={modal.dbTypeData}
          dbNames={dbList.map(getDatasourceName)}
          onSuccess={() => {
            setModal({ open: false });
            void refetchDbList();
          }}
          onClose={() => setModal({ open: false })}
        />
        <Drawer title={draw.name} placement='right' onClose={() => setDraw({ open: false })} open={draw.open}>
          {draw.type && activeDbList.length ? (
            <Spin spinning={refreshDatabase.isPending}>
              <Button
                type='primary'
                className='mb-4 flex items-center'
                icon={<PlusOutlined />}
                onClick={() => setModal({ open: true, dbType: draw.type })}
              >
                Create
              </Button>
              {activeDbList.map(item => {
                const params = getDbParams(item);
                return (
                  <Card
                    key={item.id}
                    title={getDatasourceName(item) || getFileName(String(params.path || ''))}
                    extra={
                      <>
                        <RedoOutlined className='mr-2' style={{ color: 'gray' }} onClick={() => void onRefresh(item)} />
                        <EditFilled className='mr-2' style={{ color: '#1b7eff' }} onClick={() => onModify(item)} />
                        <DeleteFilled style={{ color: '#ff1b2e' }} onClick={() => onDelete(item)} />
                      </>
                    }
                    className='mb-4'
                  >
                    <>
                      {['host', 'port', 'path', 'user', 'database', 'project', 'endpoint', 'schema']
                        .filter(key => Object.prototype.hasOwnProperty.call(params, key))
                        .map(key => (
                          <p key={key}>
                            {key}: {key === 'path' ? getFileName(String(params[key] || '')) : params[key]}
                          </p>
                        ))}
                    </>
                    <p>
                      {t('description')}: {item.description}
                    </p>
                  </Card>
                );
              })}
            </Spin>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_DEFAULT}>
              <Button
                type='primary'
                className='flex items-center mx-auto'
                icon={<PlusOutlined />}
                onClick={() => setModal({ open: true, dbType: draw.type })}
              >
                Create Now
              </Button>
            </Empty>
          )}
        </Drawer>
      </div>
    </ConstructLayout>
  );
}
