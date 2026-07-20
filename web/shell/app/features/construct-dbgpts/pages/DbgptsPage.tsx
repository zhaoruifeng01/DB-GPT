import BlurredCard, { ChatButton } from '@/new-components/common/blurredCard';
import type { IAgentPlugin } from '@/types/agent';
import { dayjs } from '@/utils/date';
import { ClearOutlined, DownloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Input, Segmented, Spin, Tag, message } from 'antd';
import type { SegmentedProps } from 'antd';
import cls from 'classnames';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConstructLayout from '~/components/construct/ConstructLayout';
import {
  useDbgptsList,
  useInstallDbgpt,
  useRefreshDbgptsHub,
  useUninstallDbgpt,
} from '~/features/construct-dbgpts/queries';

type ActiveKey = 'market' | 'my';

export default function DbgptsPage() {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [activeKey, setActiveKey] = useState<ActiveKey>('market');
  const [actionIndex, setActionIndex] = useState<number | undefined>();
  const [typeStr, setTypeStr] = useState('all');

  const pagination = useMemo(() => ({ pageNo: 1, pageSize: 20 }), []);
  const listParams = useMemo(
    () => ({
      activeKey,
      searchValue: submittedSearch,
      typeStr,
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
    }),
    [activeKey, pagination.pageNo, pagination.pageSize, submittedSearch, typeStr],
  );

  const { data: agents = [], isFetching, refetch } = useDbgptsList(listParams);
  const refreshHub = useRefreshDbgptsHub();
  const install = useInstallDbgpt();
  const uninstall = useUninstallDbgpt();

  const updateFromGithub = async () => {
    try {
      await refreshHub.mutateAsync();
      message.success('success');
    } catch {
      message.error('Refresh failed');
    }
  };

  const pluginAction = useCallback(
    async (agent: Pick<IAgentPlugin, 'name' | 'type'>, index: number, isInstall: boolean) => {
      if (actionIndex !== undefined) return;
      setActionIndex(index);
      try {
        if (isInstall) {
          await install.mutateAsync(agent);
        } else {
          await uninstall.mutateAsync(agent);
        }
        message.success('success');
      } finally {
        setActionIndex(undefined);
      }
    },
    [actionIndex, install, uninstall],
  );

  const items: SegmentedProps['options'] = [
    { value: 'market', label: t('community_dbgpts') },
    { value: 'my', label: t('my_dbgpts') },
  ];

  const typeItems: SegmentedProps['options'] = [
    { value: 'all', label: t('All') },
    { value: 'workflow', label: t('workflow') },
    { value: 'agents', label: 'Agent' },
    { value: 'resources', label: t('resources') },
    { value: 'apps', label: t('app') },
    { value: 'operators', label: t('operators') },
  ];

  const logoFn = (type: string) => {
    switch (type) {
      case 'workflow':
        return '/pictures/flow.png';
      case 'resources':
        return '/pictures/database.png';
      case 'apps':
        return '/pictures/app.png';
      case 'operators':
        return '/pictures/knowledge.png';
      case 'agents':
      default:
        return '/pictures/agent.png';
    }
  };

  const loading = isFetching || refreshHub.isPending || install.isPending || uninstall.isPending;

  return (
    <ConstructLayout>
      <Spin spinning={loading}>
        <div className='h-dvh w-full p-4 md:p-6 overflow-y-auto'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-4'>
              <Segmented
                className='backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 border-2 border-white rounded-lg shadow p-1 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
                options={items}
                onChange={key => setActiveKey(key as ActiveKey)}
                value={activeKey}
              />
            </div>
            <div className='flex items-center gap-4'>
              <Button
                className={cls('border-none text-white bg-button-gradient h-full', {
                  'opacity-40': false,
                })}
                loading={refreshHub.isPending}
                icon={<SyncOutlined />}
                onClick={() => void updateFromGithub()}
              >
                {t('Refresh_dbgpts')}
              </Button>
            </div>
          </div>
          <div className='w-full flex flex-wrap pb-12 mx-[-8px]'>
            <Segmented
              className='backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 border-2 border-white rounded-lg shadow p-1 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
              options={typeItems}
              onChange={key => setTypeStr(key as string)}
              value={typeStr}
            />
            <Input
              variant='filled'
              prefix={<SearchOutlined />}
              placeholder={t('please_enter_the_keywords')}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onPressEnter={() => {
                setSubmittedSearch(searchValue);
                void refetch();
              }}
              allowClear
              className='w-[230px] h-[40px] border-1 border-white ml-4 backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
            />
          </div>
          <div className='flex flex-wrap pb-12'>
            {agents.map((agent, index) => (
              <BlurredCard
                logo={logoFn(agent.type)}
                onClick={() => {
                  window.open(`https://github.com/eosphoros-ai/dbgpts/tree/main/${agent.type}/${agent.name}`, '_blank');
                }}
                description={agent.description}
                name={agent.name}
                key={agent.id}
                Tags={
                  <div>
                    {agent.author && <Tag>{agent.author}</Tag>}
                    {agent.version && <Tag>v{agent.version}</Tag>}
                    {agent.storage_channel && <Tag>{agent.storage_channel}</Tag>}
                  </div>
                }
                LeftBottom={
                  <div className='flex gap-2'>
                    {agent.author && <span>{agent.author}</span>}
                    {agent.author && <span>•</span>}
                    {agent?.gmt_created && <span>{dayjs(agent?.gmt_created).fromNow() + ' ' + t('update')}</span>}
                  </div>
                }
                RightTop={agent.type && <Tag>{agent.type}</Tag>}
                rightTopHover={false}
                RightBottom={
                  agent.installed || activeKey === 'my' ? (
                    <ChatButton
                      Icon={<ClearOutlined />}
                      text='Uninstall'
                      onClick={() => void pluginAction(agent, index, false)}
                    />
                  ) : (
                    <ChatButton
                      Icon={<DownloadOutlined />}
                      text='Install'
                      onClick={() => void pluginAction(agent, index, true)}
                    />
                  )
                }
              />
            ))}
          </div>
        </div>
      </Spin>
    </ConstructLayout>
  );
}
