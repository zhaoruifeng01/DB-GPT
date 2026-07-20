import MenuModal from '@/components/MenuModal';
import type { IChunk } from '@/types/knowledge';
import { MinusCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Button, Card, Empty, Form, Input, Pagination, Space, Spin, Tag } from 'antd';
import cls from 'classnames';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

import { useAddChunkQuestions, useKnowledgeChunks } from '~/features/construct-knowledge/queries';

const MarkdownContext = lazy(() => import('@/new-components/common/MarkdownContext'));
const DEFAULT_PAGE_SIZE = 10;

type ChunkWithQuestions = IChunk & { questions?: string };

function parseQuestions(raw?: string): { question: string }[] {
  if (!raw) return [];
  try {
    const questions = JSON.parse(raw) as string[];
    return questions.map(question => ({ question }));
  } catch {
    return [];
  }
}

function MarkdownPreview({ children = '' }: { children?: string }) {
  return (
    <Suspense fallback={<Spin />}>
      <MarkdownContext children={children} />
    </Suspense>
  );
}

export default function KnowledgeChunkPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const documentId = searchParams.get('id') || '';
  const spaceName = searchParams.get('spaceName') || '';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentChunkInfo, setCurrentChunkInfo] = useState<ChunkWithQuestions | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [content, setContent] = useState('');
  const [debouncedContent, setDebouncedContent] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedContent(content), 300);
    return () => window.clearTimeout(timer);
  }, [content]);

  const chunkParams = useMemo(
    () => ({
      document_id: documentId,
      page: currentPage,
      page_size: pageSize,
      content: debouncedContent || undefined,
    }),
    [currentPage, debouncedContent, documentId, pageSize],
  );

  const { data, isFetching, refetch } = useKnowledgeChunks(spaceName, chunkParams, Boolean(spaceName && documentId));
  const addQuestions = useAddChunkQuestions();
  const chunkList = data?.data || [];

  return (
    <div className='flex flex-col h-full w-full px-6 pb-6'>
      <Breadcrumb
        className='m-6'
        items={[
          {
            title: 'Knowledge',
            onClick() {
              navigate(-1);
            },
          },
          { title: spaceName },
        ]}
      />
      <div className='flex items-center gap-4'>
        <Input
          className='w-1/5 h-10 mb-4'
          prefix={<SearchOutlined />}
          placeholder={t('please_enter_the_keywords')}
          onChange={e => {
            setContent(e.target.value);
            setCurrentPage(1);
          }}
          allowClear
        />
      </div>
      {chunkList.length > 0 ? (
        <div className='h-full grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 grid-flow-row auto-rows-max gap-x-6 gap-y-10 overflow-y-auto relative'>
          <Spin className='flex flex-col items-center justify-center absolute bottom-0 top-0 left-0 right-0' spinning={isFetching} />
          {chunkList.map((chunk, index) => (
            <Card
              hoverable
              key={chunk.id}
              title={
                <Space className='flex justify-between'>
                  <Tag color='blue'># {index + (currentPage - 1) * pageSize}</Tag>
                  <span className='text-sm'>{chunk.doc_name}</span>
                </Space>
              }
              className={cls('h-auto rounded-xl overflow-hidden')}
              onClick={() => {
                setIsModalOpen(true);
                setCurrentChunkInfo(chunk);
              }}
            >
              <p className='font-semibold'>{t('Content')}:</p>
              <p>{chunk?.content}</p>
              <p className='font-semibold'>{t('Meta_Data')}: </p>
              <p>{chunk?.meta_info}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Spin spinning={isFetching}>
          <Empty image={Empty.PRESENTED_IMAGE_DEFAULT} />
        </Spin>
      )}
      <Pagination
        className='flex w-full justify-end'
        current={currentPage}
        pageSize={pageSize}
        total={data?.total || 0}
        showTotal={total => `Total ${total} items`}
        onChange={(page, nextPageSize) => {
          setCurrentPage(page);
          setPageSize(nextPageSize);
        }}
      />
      <MenuModal
        modal={{
          title: t('Manual_entry'),
          width: '70%',
          open: isModalOpen,
          footer: false,
          onCancel: () => setIsModalOpen(false),
          afterOpenChange: open => {
            if (open) {
              form.setFieldValue('questions', parseQuestions(currentChunkInfo?.questions));
            }
          },
        }}
        items={[
          {
            key: 'edit',
            label: t('Data_content'),
            children: (
              <div className='flex gap-4'>
                <Card size='small' title={t('Main_content')} className='w-2/3 flex-wrap overflow-y-auto'>
                  <MarkdownPreview>{currentChunkInfo?.content}</MarkdownPreview>
                </Card>
                <Card size='small' title={t('Auxiliary_data')} className='w-1/3'>
                  <MarkdownPreview>{currentChunkInfo?.meta_info}</MarkdownPreview>
                </Card>
              </div>
            ),
          },
          {
            key: 'delete',
            label: t('Add_problem'),
            children: (
              <Card
                size='small'
                extra={
                  <Button
                    size='small'
                    type='primary'
                    onClick={async () => {
                      const formVal = form.getFieldsValue();
                      if (!formVal.questions || formVal.questions?.filter(Boolean).length === 0) {
                        message.warning(t('enter_question_first'));
                        return;
                      }
                      const questions = formVal.questions?.filter(Boolean).map((item: { question: string }) => item.question);
                      await addQuestions.mutateAsync({ chunk_id: currentChunkInfo?.id || '', questions });
                      message.success('添加成功');
                      setIsModalOpen(false);
                      await refetch();
                    }}
                    loading={addQuestions.isPending}
                  >
                    {t('save')}
                  </Button>
                }
              >
                <Form form={form}>
                  <Form.List name='questions'>
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name }) => (
                          <div key={key} className={cls('flex flex-1 items-center gap-8')}>
                            <Form.Item label='' name={[name, 'question']} className='grow'>
                              <Input placeholder={t('Please_Input')} />
                            </Form.Item>
                            <Form.Item>
                              <MinusCircleOutlined onClick={() => remove(name)} />
                            </Form.Item>
                          </div>
                        ))}
                        <Form.Item>
                          <Button type='dashed' onClick={() => add()} block icon={<PlusOutlined />}>
                            {t('Add_problem')}
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
