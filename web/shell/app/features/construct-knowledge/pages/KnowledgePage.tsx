import { ChatContext } from '@/app/chat-context';
import DocPanel from '@/components/knowledge/doc-panel';
import DocTypeForm from '@/components/knowledge/doc-type-form';
import DocUploadForm from '@/components/knowledge/doc-upload-form';
import Segmentation from '@/components/knowledge/segmentation';
import SpaceForm from '@/components/knowledge/space-form';
import BlurredCard, { ChatButton, InnerDropdown } from '@/new-components/common/blurredCard';
import type { File, ISpace, StepChangeParams } from '@/types/knowledge';
import { dayjs } from '@/utils/date';
import { clearKey, STORAGE_KEYS, writeJSON } from '@dbgpt/shared';
import { PlusOutlined, ReadOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Spin, Steps, Tag } from 'antd';
import classNames from 'classnames';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import ConstructLayout from '~/components/construct/ConstructLayout';
import {
  useDeleteKnowledgeSpace,
  useKnowledgeConfig,
  useKnowledgeSpaces,
  useNewKnowledgeDialogue,
} from '~/features/construct-knowledge/queries';

export default function KnowledgePage() {
  const { setCurrentDialogInfo } = useContext(ChatContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAddShow, setIsAddShow] = useState(false);
  const [isPanelShow, setIsPanelShow] = useState(false);
  const [currentSpace, setCurrentSpace] = useState<ISpace>();
  const [activeStep, setActiveStep] = useState(0);
  const [spaceName, setSpaceName] = useState('');
  const [files, setFiles] = useState<Array<File>>([]);
  const [docType, setDocType] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: spaceList, isFetching, refetch: refetchSpaces } = useKnowledgeSpaces({
    name: debouncedSearch || undefined,
  });
  const { data: spaceConfig } = useKnowledgeConfig();
  const deleteSpace = useDeleteKnowledgeSpace();
  const dialogue = useNewKnowledgeDialogue();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const addKnowledgeSteps = [
    { title: t('Knowledge_Space_Config') },
    { title: t('Choose_a_Datasource_type') },
    { title: t('Upload') },
    { title: t('Segmentation') },
  ];

  const handleChat = async (space: ISpace) => {
    const data = await dialogue.mutateAsync({ chat_mode: 'chat_knowledge' });
    if (!data?.conv_uid) return;

    const dialogInfo = {
      chat_scene: data.chat_mode,
      app_code: data.chat_mode,
    };
    setCurrentDialogInfo?.(dialogInfo);
    writeJSON(STORAGE_KEYS.currentDialogInfo, dialogInfo);
    navigate(`/chat?scene=chat_knowledge&id=${data?.conv_uid}&knowledge_id=${space.name}`);
  };

  const handleStepChange = ({ label, spaceName, docType, files }: StepChangeParams) => {
    if (label === 'finish') {
      setIsAddShow(false);
      void refetchSpaces();
      setSpaceName('');
      setDocType('');
      setAddStatus('finish');
      clearKey(STORAGE_KEYS.currentSpaceId);
    } else if (label === 'forward') {
      if (activeStep === 0) void refetchSpaces();
      setActiveStep(step => step + 1);
    } else {
      setActiveStep(step => step - 1);
    }
    if (files) setFiles(files);
    if (spaceName) setSpaceName(spaceName);
    if (docType) setDocType(docType);
  };

  const onAddDoc = (nextSpaceName: string) => {
    setSpaceName(nextSpaceName);
    setActiveStep(1);
    setIsAddShow(true);
    setAddStatus('start');
  };

  const showDeleteConfirm = (space: ISpace) => {
    Modal.confirm({
      title: t('Tips'),
      icon: <WarningOutlined />,
      content: `${t('Del_Knowledge_Tips')}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      async onOk() {
        await deleteSpace.mutateAsync(space.name);
      },
    });
  };

  return (
    <ConstructLayout>
      <Spin spinning={isFetching || deleteSpace.isPending}>
        <div className='page-body p-4 md:p-6 h-[90vh] overflow-auto'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-4'>
              <Input
                variant='filled'
                prefix={<SearchOutlined />}
                placeholder={t('please_enter_the_keywords')}
                onChange={e => setSearchValue(e.target.value)}
                allowClear
                className='w-[230px] h-[40px] border-1 border-white backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
              />
            </div>

            <div className='flex items-center gap-4'>
              <Button
                className='border-none text-white bg-button-gradient'
                icon={<PlusOutlined />}
                onClick={() => setIsAddShow(true)}
              >
                {t('create_knowledge')}
              </Button>
            </div>
          </div>
          <div className='flex flex-wrap mt-4 mx-[-8px]'>
            {spaceList?.map(space => (
              <BlurredCard
                onClick={() => {
                  setCurrentSpace(space);
                  setIsPanelShow(true);
                  writeJSON(STORAGE_KEYS.currentSpaceId, space.id);
                }}
                description={space.desc}
                name={space.name}
                key={space.id}
                logo={
                  space.domain_type === 'FinancialReport'
                    ? '/models/fin_report.jpg'
                    : space.vector_type === 'KnowledgeGraph'
                      ? '/models/knowledge-graph.png'
                      : space.vector_type === 'FullText'
                        ? '/models/knowledge-full-text.jpg'
                        : '/models/knowledge-default.jpg'
                }
                RightTop={
                  <InnerDropdown
                    menu={{
                      items: [
                        {
                          key: 'del',
                          label: (
                            <span className='text-red-400' onClick={() => showDeleteConfirm(space)}>
                              {t('Delete')}
                            </span>
                          ),
                        },
                      ],
                    }}
                  />
                }
                rightTopHover={false}
                Tags={
                  <div className='flex item-center'>
                    <Tag>
                      <span className='flex items-center gap-1'>
                        <ReadOutlined className='mt-[1px]' />
                        {space.docs}
                      </span>
                    </Tag>
                    <Tag>
                      <span className='flex items-center gap-1'>{space.domain_type || 'Normal'}</span>
                    </Tag>
                    {space.vector_type ? (
                      <Tag>
                        <span className='flex items-center gap-1'>{space.vector_type}</span>
                      </Tag>
                    ) : null}
                  </div>
                }
                LeftBottom={
                  <div className='flex gap-2'>
                    <span>{space.owner}</span>
                    <span>•</span>
                    {space?.gmt_modified && <span>{dayjs(space?.gmt_modified).fromNow() + ' ' + t('update')}</span>}
                  </div>
                }
                RightBottom={<ChatButton text={t('start_chat')} onClick={() => void handleChat(space)} />}
              />
            ))}
          </div>
        </div>
        <Modal
          className='h-5/6 overflow-hidden'
          open={isPanelShow}
          width='70%'
          onCancel={() => setIsPanelShow(false)}
          footer={null}
          destroyOnClose
        >
          {currentSpace && (
            <DocPanel
              space={currentSpace}
              onAddDoc={onAddDoc}
              onDeleteDoc={() => void refetchSpaces()}
              addStatus={addStatus}
            />
          )}
        </Modal>
        <Modal
          title={t('New_knowledge_base')}
          centered
          open={isAddShow}
          destroyOnClose
          onCancel={() => setIsAddShow(false)}
          width={1000}
          afterClose={() => {
            setActiveStep(0);
            void refetchSpaces();
          }}
          footer={null}
        >
          <Steps current={activeStep} items={addKnowledgeSteps} />
          {activeStep === 0 && <SpaceForm handleStepChange={handleStepChange} spaceConfig={spaceConfig?.storage ?? null} />}
          {activeStep === 1 && <DocTypeForm handleStepChange={handleStepChange} />}
          <DocUploadForm
            className={classNames({ hidden: activeStep !== 2 })}
            spaceName={spaceName}
            docType={docType}
            handleStepChange={handleStepChange}
          />
          {activeStep === 3 && (
            <Segmentation
              spaceName={spaceName}
              docType={docType}
              uploadFiles={files}
              handleStepChange={handleStepChange}
            />
          )}
        </Modal>
      </Spin>
    </ConstructLayout>
  );
}
