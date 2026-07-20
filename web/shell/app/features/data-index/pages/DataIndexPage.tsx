import { ChatContext } from '@/app/chat-context';
import IconFont from '@/new-components/common/Icon';
import BlurredCard from '@/new-components/common/blurredCard';
import type { IApp } from '@/types/app';
import { dayjs } from '@/utils/date';
import { PlusOutlined, SearchOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { App, Avatar, Button, ConfigProvider, Input, Pagination, Segmented, Spin } from 'antd';
import type { SegmentedProps } from 'antd';
import { clearKey, STORAGE_KEYS, writeJSON } from '@dbgpt/shared';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useDataIndexApps, useDataIndexNewDialogue, useToggleAppCollection } from '~/features/data-index/queries';
import type { DataIndexTabKey } from '~/features/data-index/query-keys';

const PAGE_SIZE = 12;

function isCollected(app: IApp): boolean {
  return app.is_collected === 'true';
}

export default function DataIndexPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { model, setAgent, setCurrentDialogInfo } = useContext(ChatContext);

  const [activeKey, setActiveKey] = useState<DataIndexTabKey>('all');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchValue);
      setPage(1);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const listParams = useMemo(() => {
    const params = {
      page,
      page_size: PAGE_SIZE,
      app_name: activeKey === 'recommend' ? undefined : debouncedSearch || undefined,
      ignore_user: activeKey === 'recommend' ? undefined : ('true' as const),
      published: activeKey === 'recommend' ? undefined : ('true' as const),
      need_owner_info: activeKey === 'recommend' ? undefined : ('true' as const),
      is_collected: activeKey === 'collected' ? ('true' as const) : undefined,
    };

    return params;
  }, [activeKey, debouncedSearch, page]);

  const { data, isFetching } = useDataIndexApps(activeKey, listParams);
  const collectMutation = useToggleAppCollection();
  const dialogueMutation = useDataIndexNewDialogue();

  const items: SegmentedProps['options'] = [
    { value: 'recommend', label: t('recommend_apps') },
    { value: 'all', label: t('all_apps') },
    { value: 'collected', label: t('my_collected_apps') },
  ];

  const apps = data?.app_list ?? [];

  async function handleCollect(app: IApp) {
    try {
      const collected = isCollected(app);
      await collectMutation.mutateAsync({ appCode: app.app_code, collected });
      message.success(collected ? t('cancel_success') : t('collect_success'));
    } catch {
      message.error(t('Operation_failed'));
    }
  }

  async function handleChat(app: IApp) {
    const chatScene = app.team_mode === 'native_app' ? app.team_context?.chat_scene || '' : 'chat_agent';
    const res = await dialogueMutation.mutateAsync({ chat_mode: chatScene });
    if (!res) return;

    const dialogInfo = {
      chat_scene: res.chat_mode,
      app_code: app.app_code,
    };
    setCurrentDialogInfo?.(dialogInfo);
    writeJSON(STORAGE_KEYS.currentDialogInfo, dialogInfo);

    if (app.team_mode !== 'native_app') {
      setAgent?.(app.app_code);
    }

    const scene = app.team_mode === 'native_app' ? chatScene : 'chat_agent';
    const modelQuery = model ? `&model=${model}` : '';
    navigate(`/chat?scene=${scene}&id=${res.conv_uid}${modelQuery}`);
  }

  function handleCreate() {
    clearKey(STORAGE_KEYS.appDraft);
    navigate('/construct/app?openModal=true');
  }

  return (
    <div className='flex h-full w-full flex-col backdrop-filter backdrop-blur dark:bg-gradient-dark bg-gradient-light p-10 pt-12'>
      <ConfigProvider
        theme={{
          components: {
            Button: {
              defaultBorderColor: 'white',
            },
            Segmented: {
              itemSelectedBg: '#2867f5',
              itemSelectedColor: 'white',
            },
          },
        }}
      >
        <div className='relative mt-4 flex h-full flex-col overflow-hidden pb-12'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex min-w-0 items-center gap-4'>
              <Segmented
                className='h-10 shrink-0 backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 border border-white rounded-lg shadow p-1 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
                options={items}
                onChange={key => {
                  setActiveKey(key as DataIndexTabKey);
                  setPage(1);
                }}
                value={activeKey}
              />
              <Input
                variant='filled'
                value={searchValue}
                prefix={<SearchOutlined />}
                placeholder={t('please_enter_the_keywords')}
                onChange={event => setSearchValue(event.target.value)}
                allowClear
                className={activeKey === 'recommend' ? 'hidden' : 'w-[230px] h-[40px] border-1 border-white backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'}
              />
            </div>

            <Button className='border-none text-white bg-button-gradient' icon={<PlusOutlined />} onClick={handleCreate}>
              {t('create_app')}
            </Button>
          </div>

          <Spin
            size='large'
            className='flex min-h-[320px] flex-1 flex-col'
            spinning={isFetching || collectMutation.isPending || dialogueMutation.isPending}
          >
            <div className='mx-[-8px] flex flex-1 flex-wrap overflow-y-auto pb-6'>
              {apps.map(item => (
                <BlurredCard
                  key={item.app_code}
                  name={item.app_name}
                  description={item.app_describe}
                  className='w-full sm:w-1/2 xl:w-1/3'
                  RightTop={
                    isCollected(item) ? (
                      <StarFilled
                        onClick={() => void handleCollect(item)}
                        style={{
                          height: '21px',
                          cursor: 'pointer',
                          color: '#f9c533',
                        }}
                      />
                    ) : (
                      <StarOutlined
                        onClick={() => void handleCollect(item)}
                        style={{
                          height: '21px',
                          cursor: 'pointer',
                        }}
                      />
                    )
                  }
                  onClick={() => void handleChat(item)}
                  LeftBottom={
                    <div className='flex flex-wrap items-center gap-3 text-sm text-[#878c93] dark:text-stone-200'>
                      {item.owner_name && (
                        <div className='flex items-center gap-1'>
                          <Avatar src={item.owner_avatar_url} className='bg-icon-gradient cursor-pointer'>
                            {item.owner_name}
                          </Avatar>
                          <span>{item.owner_name}</span>
                        </div>
                      )}
                      {activeKey === 'recommend' ? (
                        <div className='flex items-start gap-1'>
                          <IconFont type='icon-hot' className='text-lg' />
                          <span className='text-[#878c93]'>{item.hot_value}</span>
                        </div>
                      ) : (
                        item.updated_at && <div>{dayjs(item.updated_at).fromNow() + ' ' + t('update')}</div>
                      )}
                    </div>
                  }
                  scene={item.team_context?.chat_scene || 'chat_agent'}
                />
              ))}
            </div>

            {activeKey !== 'recommend' && (
              <div className='flex justify-end pb-2'>
                <Pagination
                  total={data?.total_count || 0}
                  pageSize={PAGE_SIZE}
                  current={data?.current_page || page}
                  onChange={nextPage => setPage(nextPage)}
                />
              </div>
            )}
          </Spin>
        </div>
      </ConfigProvider>
    </div>
  );
}
