import type { IChatDialogueSchema } from '@/types/chat';
import { dayjs } from '@/utils/date';
import { DeleteOutlined, MessageOutlined, SearchOutlined } from '@ant-design/icons';
import { Empty, Input, Pagination, Popconfirm, Spin, Tooltip, App } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useConversationList, useDeleteConversation } from '~/features/conversations/queries';

const PAGE_SIZE = 20;

function getTitle(conv: IChatDialogueSchema, fallback: string): string {
  if (typeof conv.user_input === 'string' && conv.user_input.trim()) {
    return conv.user_input;
  }
  return fallback;
}

export default function ConversationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchKeyword(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(() => ({ chat_mode: 'chat_react_agent' }), []);
  const listQuery = useConversationList(params, page, PAGE_SIZE);
  const deleteMutation = useDeleteConversation();
  const list = listQuery.data?.items ?? [];

  const filteredList = useMemo(() => {
    if (!searchKeyword.trim()) return list;
    const keyword = searchKeyword.toLowerCase();
    return list.filter(conv => {
      const title = typeof conv.user_input === 'string' ? conv.user_input.toLowerCase() : '';
      return title.includes(keyword);
    });
  }, [list, searchKeyword]);

  async function handleDelete(convUid: string) {
    await deleteMutation.mutateAsync(convUid);
    message.success('已删除');
    const totalCount = listQuery.data?.total_count ?? 0;
    const maxPage = Math.max(1, Math.ceil(Math.max(0, totalCount - 1) / PAGE_SIZE));
    setPage(current => Math.min(current, maxPage));
  }

  return (
    <div className='flex h-full w-full flex-col dark:bg-gradient-dark bg-gradient-light'>
      <div className='flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800'>
        <h1 className='text-xl font-semibold text-gray-800 dark:text-gray-100'>{t('all_tasks') || '所有任务'}</h1>
        <div className='flex items-center gap-3'>
          <Input
            variant='filled'
            prefix={<SearchOutlined />}
            placeholder='搜索对话...'
            value={searchInput}
            onChange={event => setSearchInput(event.target.value)}
            allowClear
            className='h-[36px] w-[230px] border-1 border-white backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
          />
          <span className='whitespace-nowrap text-sm text-gray-400'>
            {listQuery.data ? `共 ${listQuery.data.total_count} 条` : ''}
          </span>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-6 py-4'>
        <Spin spinning={listQuery.isFetching || deleteMutation.isPending}>
          {!listQuery.isFetching && list.length === 0 ? (
            <div className='flex h-64 items-center justify-center'>
              <Empty description={t('no_tasks') || '暂无历史记录'} />
            </div>
          ) : !listQuery.isFetching && filteredList.length === 0 ? (
            <div className='flex h-64 items-center justify-center'>
              <Empty description='没有匹配的对话' />
            </div>
          ) : (
            <div className='space-y-1'>
              {filteredList.map(conv => (
                <div
                  key={conv.conv_uid}
                  onClick={() => navigate(`/?id=${conv.conv_uid}`)}
                  className='group flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-white hover:shadow-sm dark:hover:bg-gray-800'
                >
                  <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700'>
                    <MessageOutlined className='text-sm text-gray-400' />
                  </div>

                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium leading-5 text-gray-700 dark:text-gray-200'>
                      {getTitle(conv, t('new_task') || '新对话')}
                    </div>
                    {conv.gmt_created && (
                      <div className='mt-0.5 text-xs text-gray-400'>{dayjs(conv.gmt_created).fromNow()}</div>
                    )}
                  </div>

                  <Popconfirm
                    title='确认删除这条对话记录吗？'
                    onConfirm={() => void handleDelete(conv.conv_uid)}
                    okText='删除'
                    cancelText='取消'
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title='删除'>
                      <div
                        onClick={event => {
                          event.stopPropagation();
                          event.preventDefault();
                        }}
                        className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                      >
                        <DeleteOutlined className='text-gray-300 transition-colors hover:text-red-500' />
                      </div>
                    </Tooltip>
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
        </Spin>
      </div>

      {(listQuery.data?.total_count ?? 0) > PAGE_SIZE && (
        <div className='flex justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-800'>
          <Pagination
            current={listQuery.data?.page ?? page}
            total={listQuery.data?.total_count ?? 0}
            pageSize={PAGE_SIZE}
            showSizeChanger={false}
            showTotal={total => `共 ${total} 条`}
            onChange={nextPage => setPage(nextPage)}
          />
        </div>
      )}
    </div>
  );
}
