import { ChatContext } from '@/app/chat-context';
import BlurredCard, { ChatButton, InnerDropdown } from '@/new-components/common/blurredCard';
import CreateAppModal from '@/pages/construct/app/components/create-app-modal';
import type { IApp } from '@/types/app';
import { dayjs } from '@/utils/date';
import { clearKey, STORAGE_KEYS, writeJSON } from '@dbgpt/shared';
import { BulbOutlined, DingdingOutlined, PlusOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { App, Button, Input, Modal, Pagination, Popover, Segmented, Spin, Tag } from 'antd';
import type { SegmentedProps } from 'antd';
import copy from 'copy-to-clipboard';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

import ConstructLayout from '~/components/construct/ConstructLayout';
import { useAppList, useDeleteApp, useNewAppDialogue, usePublishApp } from '~/features/construct-app/queries';

type TabKey = 'all' | 'published' | 'unpublished';

const PAGE_SIZE = 12;

function getPublishedFilter(activeKey: TabKey): 'true' | 'false' | undefined {
  if (activeKey === 'published') return 'true';
  if (activeKey === 'unpublished') return 'false';
  return undefined;
}

export default function AppListPage() {
  const { t } = useTranslation();
  const { model, setAgent: setAgentToChat, setCurrentDialogInfo } = useContext(ChatContext);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<TabKey>('all');
  const [filterValue, setFilterValue] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      app_name: debouncedFilter || undefined,
      published: getPublishedFilter(activeKey),
    }),
    [activeKey, debouncedFilter, page],
  );
  const { data, isFetching, refetch } = useAppList(listParams);
  const publishMutation = usePublishApp();
  const deleteMutation = useDeleteApp();
  const dialogueMutation = useNewAppDialogue();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedFilter(filterValue);
      setPage(1);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [filterValue]);

  useEffect(() => {
    if (searchParams.get('openModal')) {
      clearKey(STORAGE_KEYS.appDraft);
      setOpen(true);
    }
  }, [searchParams]);

  const languageMap = {
    en: t('English'),
    zh: t('Chinese'),
  } as const;

  const handleCreate = () => {
    clearKey(STORAGE_KEYS.appDraft);
    setOpen(true);
  };

  const handleEdit = (app: IApp) => {
    const appDraft = { ...app, isEdit: true };
    writeJSON(STORAGE_KEYS.appDraft, appDraft);
    navigate('/construct/app/extra', { state: { app: appDraft } });
  };

  const showDeleteConfirm = (app: IApp) => {
    Modal.confirm({
      title: t('Tips'),
      icon: <WarningOutlined />,
      content: `你想删除这个应用吗?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      async onOk() {
        await deleteMutation.mutateAsync(app.app_code);
      },
    });
  };

  const handlePublish = async (app: IApp) => {
    try {
      await publishMutation.mutateAsync({ appCode: app.app_code, published: app.published });
      message.success('操作成功');
    } catch {
      message.error('操作失败');
    }
  };

  const handleChat = async (app: IApp) => {
    const chatScene = app.team_mode === 'native_app' ? app.team_context?.chat_scene || '' : 'chat_agent';
    const res = await dialogueMutation.mutateAsync({ chat_mode: chatScene });
    if (!res) return;

    const dialogInfo = {
      chat_scene: res.chat_mode,
      app_code: app.team_mode === 'native_app' ? app.app_code : app.app_code,
    };
    setCurrentDialogInfo?.(dialogInfo);
    writeJSON(STORAGE_KEYS.currentDialogInfo, dialogInfo);

    if (app.team_mode !== 'native_app') {
      setAgentToChat?.(app.app_code);
    }

    const scene = app.team_mode === 'native_app' ? chatScene : 'chat_agent';
    const modelQuery = model ? `&model=${model}` : '';
    navigate(`/chat?scene=${scene}&id=${res.conv_uid}${modelQuery}`);
  };

  const shareDingding = (item: IApp) => {
    if (clickTimeout) {
      window.clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    const timeoutId = window.setTimeout(() => {
      const mobileUrl = `${window.location.origin}/mobile/chat/?chat_scene=${item?.team_context?.chat_scene || 'chat_agent'}&app_code=${item.app_code}`;
      const dingDingUrl = `dingtalk://dingtalkclient/page/link?url=${encodeURIComponent(mobileUrl)}&pc_slide=true`;
      const result = copy(dingDingUrl);
      message[result ? 'success' : 'error'](result ? '复制成功' : '复制失败');
      setClickTimeout(null);
    }, 300);
    setClickTimeout(timeoutId);
  };

  const openDingding = (item: IApp) => {
    if (clickTimeout) {
      window.clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    const mobileUrl = `${window.location.origin}/mobile/chat/?chat_scene=${item?.team_context?.chat_scene || 'chat_agent'}&app_code=${item.app_code}`;
    const dingDingUrl = `dingtalk://dingtalkclient/page/link?url=${encodeURIComponent(mobileUrl)}&pc_slide=true`;
    window.open(dingDingUrl);
  };

  const items: SegmentedProps['options'] = [
    { value: 'all', label: t('apps') },
    { value: 'published', label: t('published') },
    { value: 'unpublished', label: t('unpublished') },
  ];

  return (
    <ConstructLayout>
      <Spin spinning={isFetching || deleteMutation.isPending || publishMutation.isPending}>
        <div className='h-dvh w-full p-4 md:p-6 overflow-y-auto'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-4'>
              <Segmented
                className='backdrop-filter h-10 backdrop-blur-lg bg-white bg-opacity-30 border border-white rounded-lg shadow p-1 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
                options={items}
                onChange={value => {
                  setActiveKey(value as TabKey);
                  setPage(1);
                }}
                value={activeKey}
              />
              <Input
                variant='filled'
                value={filterValue}
                prefix={<SearchOutlined />}
                placeholder={t('please_enter_the_keywords')}
                onChange={e => setFilterValue(e.target.value)}
                allowClear
                className='w-[230px] h-[40px] border-1 border-white backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
              />
            </div>

            <Button
              className='border-none text-white bg-button-gradient flex items-center'
              icon={<PlusOutlined className='text-base' />}
              onClick={handleCreate}
            >
              {t('create_app')}
            </Button>
          </div>
          <div className='w-full flex flex-wrap pb-12 mx-[-8px]'>
            {(data?.app_list || []).map(item => (
              <BlurredCard
                key={item.app_code}
                code={item.app_code}
                name={item.app_name}
                description={item.app_describe}
                RightTop={
                  <div className='flex items-center gap-2'>
                    <Popover
                      content={
                        <div className='flex flex-col gap-2'>
                          <div className='flex items-center gap-2'>
                            <BulbOutlined style={{ color: 'rgb(252,204,96)', fontSize: 12 }} />
                            <span className='text-sm text-gray-500'>{t('copy_url')}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <BulbOutlined style={{ color: 'rgb(252,204,96)', fontSize: 12 }} />
                            <span className='text-sm text-gray-500'>{t('double_click_open')}</span>
                          </div>
                        </div>
                      }
                    >
                      <DingdingOutlined
                        className='cursor-pointer text-[#0069fe] hover:bg-white hover:dark:bg-black p-2 rounded-md'
                        onClick={() => shareDingding(item)}
                        onDoubleClick={() => openDingding(item)}
                      />
                    </Popover>
                    <InnerDropdown
                      menu={{
                        items: [
                          {
                            key: 'publish',
                            label: (
                              <span
                                onClick={e => {
                                  e.stopPropagation();
                                  void handlePublish(item);
                                }}
                              >
                                {item.published === 'true' ? t('unpublish') : t('publish')}
                              </span>
                            ),
                          },
                          {
                            key: 'del',
                            label: (
                              <span
                                className='text-red-400'
                                onClick={e => {
                                  e.stopPropagation();
                                  showDeleteConfirm(item);
                                }}
                              >
                                {t('Delete')}
                              </span>
                            ),
                          },
                        ],
                      }}
                    />
                  </div>
                }
                Tags={
                  <div>
                    <Tag>{languageMap[item.language] ?? item.language}</Tag>
                    <Tag>{item.team_mode}</Tag>
                    <Tag>{item.published === 'true' ? t('published') : t('unpublished')}</Tag>
                  </div>
                }
                rightTopHover={false}
                LeftBottom={
                  <div className='flex gap-2'>
                    <span>{item.owner_name}</span>
                    <span>•</span>
                    {item?.updated_at && <span>{dayjs(item?.updated_at).fromNow() + ' ' + t('update')}</span>}
                  </div>
                }
                RightBottom={<ChatButton onClick={() => void handleChat(item)} />}
                onClick={() => handleEdit(item)}
                scene={item?.team_context?.chat_scene || 'chat_agent'}
              />
            ))}
            <div className='w-full flex justify-end shrink-0 pb-12'>
              <Pagination
                total={data?.total_count || 0}
                pageSize={PAGE_SIZE}
                current={data?.current_page || page}
                onChange={nextPage => setPage(nextPage)}
              />
            </div>
          </div>
          {open && (
            <CreateAppModal
              open={open}
              onCancel={() => setOpen(false)}
              refresh={() => refetch()}
              type='add'
            />
          )}
        </div>
      </Spin>
    </ConstructLayout>
  );
}
