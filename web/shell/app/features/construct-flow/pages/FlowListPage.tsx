import { ChatContext } from '@/app/chat-context';
import MyEmpty from '@/components/common/MyEmpty';
import BlurredCard, { ChatButton, InnerDropdown } from '@/new-components/common/blurredCard';
import type { IFlow, IFlowUpdateParam } from '@/types/flow';
import { dayjs } from '@/utils/date';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Modal, Pagination, Popconfirm, Spin, Tag, message } from 'antd';
import { useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import ConstructLayout from '~/components/construct/ConstructLayout';
import { useCopyFlow, useDeleteFlow, useFlowList, useNewFlowDialogue } from '~/features/construct-flow/queries';

const PAGE_SIZE = 12;

export default function FlowListPage() {
  const navigate = useNavigate();
  const { model } = useContext(ChatContext);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<Pick<IFlow, 'label' | 'name'>>();
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [copySource, setCopySource] = useState<IFlow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deploy, setDeploy] = useState(false);
  const [editable, setEditable] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const listParams = useMemo(() => ({ page, page_size: PAGE_SIZE }), [page]);
  const { data, isFetching } = useFlowList(listParams);
  const copyFlow = useCopyFlow();
  const deleteFlow = useDeleteFlow();
  const dialogueMutation = useNewFlowDialogue();
  const flowList = data?.items ?? [];

  const handleChat = async (flow: IFlow) => {
    const res = await dialogueMutation.mutateAsync({ chat_mode: 'chat_agent' });
    if (!res) return;
    const params = new URLSearchParams({
      scene: 'chat_flow',
      id: res.conv_uid,
      select_param: flow.uid,
    });
    if (model) {
      params.set('model', model);
    }
    navigate(`/chat?${params.toString()}`);
  };

  const handleDelete = async (flow: IFlow) => {
    try {
      await deleteFlow.mutateAsync(flow.uid);
      messageApi.success(t('Delete_Success'));
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : t('Delete_Failed'));
    }
  };

  const handleCopy = (flow: IFlow) => {
    setCopySource(flow);
    form.setFieldValue('label', `${flow.label} Copy`);
    form.setFieldValue('name', `${flow.name}_copy`);
    setEditable(true);
    setDeploy(false);
    setShowModal(true);
  };

  const onFinish = async (val: { name: string; label: string }) => {
    if (!copySource) return;
    const { source, uid, dag_id, gmt_created, gmt_modified, state, ...params } = copySource;
    const data: IFlowUpdateParam = {
      ...params,
      editable,
      state: deploy ? 'deployed' : 'developing',
      ...val,
    };
    await copyFlow.mutateAsync(data);
    messageApi.success(t('save_flow_success'));
    setShowModal(false);
    setCopySource(null);
  };

  return (
    <ConstructLayout>
      <Spin spinning={isFetching || deleteFlow.isPending || copyFlow.isPending || dialogueMutation.isPending}>
        <div className='relative h-dvh w-full p-4 md:p-6 overflow-y-auto' ref={scrollRef}>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-4' />

            <div className='flex items-center gap-4'>
              <Button
                className='border-none text-white bg-button-gradient'
                icon={<PlusOutlined />}
                onClick={() => {
                  navigate('/construct/flow/canvas');
                }}
              >
                {t('create_flow')}
              </Button>
            </div>
          </div>
          <div className='flex flex-wrap mx-[-8px] pb-12 justify-start items-stretch'>
            {flowList.map(flow => (
              <BlurredCard
                description={flow.description}
                name={flow.name}
                key={flow.uid}
                logo={`${flow.define_type === 'python' ? '/pictures/libro.png' : '/pictures/flow.png'}`}
                onClick={() => {
                  if (flow.define_type === 'json') {
                    navigate(`/construct/flow/canvas?id=${flow.uid}`);
                  }
                  if (flow.define_type === 'python') {
                    navigate(`/construct/flow/libro?id=${flow.uid}`);
                  }
                }}
                RightTop={
                  <InnerDropdown
                    menu={{
                      items: [
                        {
                          key: 'copy',
                          label: (
                            <span
                              onClick={() => {
                                handleCopy(flow);
                              }}
                            >
                              {t('Copy_Btn')}
                            </span>
                          ),
                        },
                        {
                          key: 'del',
                          label: (
                            <Popconfirm title='Are you sure to delete this flow?' onConfirm={() => handleDelete(flow)}>
                              <span className='text-red-400'>{t('Delete_Btn')}</span>
                            </Popconfirm>
                          ),
                        },
                      ],
                    }}
                  />
                }
                rightTopHover={false}
                Tags={
                  <div>
                    <Tag color={flow.source === 'DBGPT-WEB' ? 'green' : 'blue'}>{flow.source}</Tag>
                    {flow.define_type && <Tag color='purple'>{flow.define_type}</Tag>}
                    <Tag color={flow.editable ? 'green' : 'gray'}>{flow.editable ? 'Editable' : 'Can not Edit'}</Tag>
                    <Tag color={flow.state === 'load_failed' ? 'red' : flow.state === 'running' ? 'green' : 'blue'}>
                      {flow.state}
                    </Tag>
                  </div>
                }
                LeftBottom={
                  <div key={`${i18n.language}flow`} className='flex gap-2'>
                    <span>{flow.nick_name}</span>
                    <span>•</span>
                    {flow.gmt_modified && <span>{`${dayjs(flow.gmt_modified).fromNow()} ${t('update')}`}</span>}
                  </div>
                }
                RightBottom={
                  <ChatButton
                    onClick={() => {
                      void handleChat(flow);
                    }}
                    text={t('start_chat')}
                  />
                }
              />
            ))}
            {flowList.length === 0 && <MyEmpty description='No flow found' />}
            <div className='w-full flex justify-end shrink-0 pb-12'>
              <Pagination
                total={data?.total_count || 0}
                pageSize={PAGE_SIZE}
                current={data?.page || page}
                onChange={nextPage => setPage(nextPage)}
              />
            </div>
          </div>
        </div>
      </Spin>

      <Modal
        open={showModal}
        destroyOnClose
        title='Copy AWEL Flow'
        onCancel={() => {
          setShowModal(false);
          setCopySource(null);
        }}
        footer={false}
      >
        <Form form={form} onFinish={onFinish} className='mt-6'>
          <Form.Item name='name' label='Name' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name='label' label='Label' rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label='editable'>
            <Checkbox
              value={editable}
              checked={editable}
              onChange={e => {
                setEditable(e.target.checked);
              }}
            />
          </Form.Item>
          <Form.Item label='deploy'>
            <Checkbox
              value={deploy}
              checked={deploy}
              onChange={e => {
                setDeploy(e.target.checked);
              }}
            />
          </Form.Item>
          <div className='flex justify-end'>
            <Button type='primary' htmlType='submit'>
              {t('Submit')}
            </Button>
          </div>
        </Form>
      </Modal>
      {contextHolder}
    </ConstructLayout>
  );
}
