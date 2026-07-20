import {
  CloseOutlined,
  CloudUploadOutlined,
  DownOutlined,
  EllipsisOutlined,
  GithubOutlined,
  InboxOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Tree,
  Upload,
  message,
  theme,
} from 'antd';
import type { MenuProps, UploadFile, UploadProps } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import type { Key } from 'react';
import { useTranslation } from 'react-i18next';

import ConstructLayout from '~/components/construct/ConstructLayout';
import { useImportGithubSkill, useSkillDetail, useSkillsList, useUploadSkill } from '~/features/construct-skills/queries';
import type { SkillItem, SkillTreeNode } from '~/features/construct-skills/types';

const MarkdownContext = lazy(() => import('@/new-components/common/MarkdownContext'));

function MarkdownPreview({ children = '' }: { children?: string }) {
  return (
    <Suspense fallback={<Spin />}>
      <MarkdownContext children={children} />
    </Suspense>
  );
}

function getSkillEmoji(skillType: string): string {
  switch (skillType) {
    case 'data_analysis':
      return '\u{1F4CA}';
    case 'coding':
      return '\u{1F4BB}';
    case 'web_search':
      return '\u{1F50D}';
    case 'knowledge_qa':
      return '\u{1F4DA}';
    case 'chat':
      return '\u{1F4AC}';
    default:
      return '\u26A1';
  }
}

function toAntTreeData(node: SkillTreeNode): DataNode {
  const result: DataNode = {
    title: node.title,
    key: node.key,
  };
  if (node.children && node.children.length > 0) {
    result.children = node.children.map(toAntTreeData);
  }
  return result;
}

function isValidGithubUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return ['github.com', 'skills.sh'].some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export default function SkillsPage() {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [officialOnly, setOfficialOnly] = useState(false);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [detailFilePath, setDetailFilePath] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importForm] = Form.useForm<{ github_url: string }>();
  const [githubUrlValue, setGithubUrlValue] = useState('');
  const { token } = theme.useToken();

  const { data: skillsList = [], isFetching: listLoading } = useSkillsList();
  const uploadSkill = useUploadSkill();
  const importGithubSkill = useImportGithubSkill();
  const { data: skillDetail, isFetching: detailLoading } = useSkillDetail(
    selectedSkill?.name,
    detailFilePath,
    detailOpen && Boolean(selectedSkill?.name && detailFilePath),
  );

  const filteredSkills = useMemo(() => {
    let list = skillsList;
    if (officialOnly) {
      list = list.filter(skill => skill.type === 'official');
    }
    if (searchValue.trim()) {
      const q = searchValue.trim().toLowerCase();
      list = list.filter(skill => skill.name.toLowerCase().includes(q) || skill.description.toLowerCase().includes(q));
    }
    return list;
  }, [officialOnly, searchValue, skillsList]);

  const handleCardClick = useCallback((skill: SkillItem) => {
    setSelectedSkill(skill);
    setDetailFilePath(skill.file_path);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedSkill(null);
    setDetailFilePath('');
  }, []);

  const handleToggle = useCallback((skillId: string, checked: boolean) => {
    setEnabledMap(prev => ({ ...prev, [skillId]: checked }));
  }, []);

  const handleTreeSelect = useCallback(
    (selectedKeys: Key[]) => {
      if (!selectedSkill || selectedKeys.length === 0 || !skillDetail?.tree) return;
      const selectedKey = selectedKeys[0];
      if (!selectedKey) return;
      const key = String(selectedKey);

      const findNode = (node: SkillTreeNode, target: string): SkillTreeNode | null => {
        if (node.key === target) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child, target);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNode = findNode(skillDetail.tree, key);
      if (targetNode && (!targetNode.children || targetNode.children.length === 0)) {
        const rootDir = skillDetail.root_dir || '';
        setDetailFilePath(rootDir ? `${rootDir}/${key}` : key);
      }
    },
    [selectedSkill, skillDetail],
  );

  const treeData = useMemo(() => {
    if (!skillDetail?.tree) return [];
    return [toAntTreeData(skillDetail.tree)];
  }, [skillDetail]);

  const handleUpload = useCallback(async () => {
    if (uploadFileList.length === 0) return;
    let successCount = 0;

    for (const file of uploadFileList) {
      const rawFile = file.originFileObj;
      if (!rawFile) {
        message.error(`${file.name}: ${t('skills_file_invalid')}`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', rawFile, rawFile.name);

      try {
        const result = await uploadSkill.mutateAsync(formData);
        if (result.success) {
          successCount++;
        } else {
          message.error(`${file.name}: ${result.err_msg || t('skills_upload_failed')}`);
        }
      } catch (err) {
        console.error('[Skills] Upload error:', err);
        message.error(`${file.name}: ${t('skills_upload_failed')}`);
      }
    }

    if (successCount > 0) {
      message.success(t('skills_upload_success', { count: successCount }));
      setUploadOpen(false);
      setUploadFileList([]);
    }
  }, [t, uploadFileList, uploadSkill]);

  const uploadProps: UploadProps = {
    multiple: true,
    accept: '.zip,.skill,.md,.yaml,.yml,.json',
    fileList: uploadFileList,
    beforeUpload: file => {
      const entry: UploadFile = {
        uid: file.uid || `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        originFileObj: file,
      };
      setUploadFileList(prev => [...prev, entry]);
      return false;
    },
    onRemove: file => {
      setUploadFileList(prev => prev.filter(item => item.uid !== file.uid));
    },
  };

  const handleGithubImport = async () => {
    try {
      const values = await importForm.validateFields();
      await importGithubSkill.mutateAsync(values.github_url);
      message.success(t('skills_github_import_success'));
      setImportModalVisible(false);
      importForm.resetFields();
      setGithubUrlValue('');
    } catch (err) {
      if (typeof err === 'object' && err && 'errorFields' in err) return;
      message.error(t('skills_github_import_failed'));
    }
  };

  const addMenuItems: MenuProps['items'] = [
    {
      key: 'upload',
      icon: <CloudUploadOutlined />,
      label: (
        <div>
          <div className='font-medium'>{t('skills_upload_skill')}</div>
          <div className='text-xs text-gray-400'>{t('skills_upload_skill_desc')}</div>
        </div>
      ),
      onClick: () => setUploadOpen(true),
    },
    {
      key: 'import_github',
      icon: <GithubOutlined />,
      label: (
        <div>
          <div className='font-medium'>{t('skills_import_github')}</div>
          <div className='text-xs text-gray-400'>{t('skills_import_github_desc')}</div>
        </div>
      ),
      onClick: () => setImportModalVisible(true),
    },
  ];

  return (
    <ConstructLayout>
      <Spin spinning={listLoading}>
        <div className='h-dvh w-full p-4 md:p-6 overflow-y-auto'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-1'>{t('skills')}</h1>
            <p className='text-sm text-gray-500 dark:text-gray-400'>{t('skills_page_subtitle')}</p>
          </div>

          <div className='flex items-center gap-3 mb-6'>
            <Input
              prefix={<SearchOutlined className='text-gray-400' />}
              placeholder={t('skills_search_placeholder')}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              allowClear
              className='w-[240px] h-[36px] backdrop-filter backdrop-blur-lg bg-white bg-opacity-30 border border-gray-200 rounded-lg dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
            />
            <Tag
              className='cursor-pointer select-none px-3 py-1 rounded-lg text-sm'
              color={officialOnly ? 'blue' : undefined}
              onClick={() => setOfficialOnly(!officialOnly)}
            >
              {officialOnly ? '✓ ' : ''}
              {t('skills_official_tag')}
            </Tag>
            <div className='flex-1' />
            <Dropdown menu={{ items: addMenuItems }} trigger={['click']}>
              <Button className='border-none text-white bg-button-gradient flex items-center' icon={<PlusOutlined />}>
                {t('skills_add_btn')} <DownOutlined className='ml-1 text-[10px]' />
              </Button>
            </Dropdown>
          </div>

          {filteredSkills.length === 0 && !listLoading ? (
            <div className='flex items-center justify-center h-60 text-gray-400 dark:text-gray-500'>{t('skills_empty')}</div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pb-12'>
              {filteredSkills.map(skill => (
                <div
                  key={skill.id || skill.name}
                  className='backdrop-filter backdrop-blur-lg bg-white bg-opacity-70 border-2 border-white rounded-lg shadow p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-200 relative group dark:border-[#6f7f95] dark:bg-[#6f7f95] dark:bg-opacity-60'
                  onClick={() => handleCardClick(skill)}
                >
                  <div className='absolute top-4 right-4 z-10' onClick={e => e.stopPropagation()}>
                    <Switch
                      size='small'
                      checked={enabledMap[skill.id || skill.name] ?? true}
                      onChange={checked => handleToggle(skill.id || skill.name, checked)}
                    />
                  </div>

                  <div className='flex items-center gap-2 mb-2 pr-12'>
                    <span className='text-lg'>{getSkillEmoji(skill.skill_type)}</span>
                    <Tooltip title={skill.name}>
                      <span className='font-semibold text-base text-gray-900 dark:text-white line-clamp-1'>{skill.name}</span>
                    </Tooltip>
                  </div>

                  <p className='text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px] mb-3'>
                    {skill.description || t('no_data')}
                  </p>

                  <div className='flex items-center justify-between text-xs text-gray-400 dark:text-gray-500'>
                    <div className='flex items-center gap-2'>
                      {skill.type === 'official' ? (
                        <Tag color='blue' className='text-xs m-0'>
                          {t('skills_official_tag')}
                        </Tag>
                      ) : (
                        <span>@{skill.author || 'unknown'}</span>
                      )}
                      <span>·</span>
                      <span>{t('skills_updated_at', { date: '2026-02-06' })}</span>
                    </div>
                    <div className='opacity-0 group-hover:opacity-100 transition-opacity' onClick={e => e.stopPropagation()}>
                      <EllipsisOutlined className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Spin>

      <Modal
        open={detailOpen}
        onCancel={handleCloseDetail}
        footer={null}
        width='80vw'
        style={{ maxWidth: 1000, top: 40 }}
        closable={false}
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        <div className='flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700'>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-base text-gray-900 dark:text-white'>{selectedSkill?.name || ''}.skill</span>
            <Tag color='blue' className='text-xs'>
              {t('skills_detail_tag')}
            </Tag>
          </div>
          <div className='flex items-center gap-2'>
            <Button type='default' size='small'>
              {t('skills_try_btn')}
            </Button>
            <EllipsisOutlined className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer' />
            <CloseOutlined
              className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer'
              onClick={handleCloseDetail}
            />
          </div>
        </div>

        <Spin spinning={detailLoading}>
          <div className='flex' style={{ minHeight: 480 }}>
            <div className='w-[220px] border-r border-gray-100 dark:border-gray-700 p-3 overflow-y-auto bg-gray-50 dark:bg-[#2a2f38]'>
              {treeData.length > 0 ? (
                <Tree
                  showLine
                  defaultExpandAll
                  treeData={treeData}
                  onSelect={handleTreeSelect}
                  className='bg-transparent'
                />
              ) : (
                <div className='text-gray-400 text-sm text-center mt-8'>{t('skills_loading')}</div>
              )}
            </div>

            <div className='flex-1 overflow-y-auto p-6' style={{ maxHeight: 'calc(80vh - 100px)' }}>
              {skillDetail ? (
                <>
                  {skillDetail.frontmatter && (
                    <div className='mb-6 rounded-lg bg-gray-50 dark:bg-[#2a2f38] border border-gray-200 dark:border-gray-700 overflow-hidden'>
                      <div className='flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700'>
                        <Tag className='text-xs m-0'>YAML</Tag>
                      </div>
                      <pre className='p-4 m-0 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap'>
                        <code>{skillDetail.frontmatter}</code>
                      </pre>
                    </div>
                  )}

                  {skillDetail.instructions && (
                    <div className='prose dark:prose-invert max-w-none'>
                      <MarkdownPreview>{skillDetail.instructions}</MarkdownPreview>
                    </div>
                  )}

                  {!skillDetail.frontmatter && !skillDetail.instructions && skillDetail.raw_content && (
                    <div className='prose dark:prose-invert max-w-none'>
                      <MarkdownPreview>{skillDetail.raw_content}</MarkdownPreview>
                    </div>
                  )}
                </>
              ) : (
                !detailLoading && (
                  <div className='flex items-center justify-center h-full text-gray-400'>{t('skills_select_file_tip')}</div>
                )
              )}
            </div>
          </div>
        </Spin>
      </Modal>

      <Modal
        open={uploadOpen}
        onCancel={() => {
          setUploadOpen(false);
          setUploadFileList([]);
        }}
        title={t('skills_upload_modal_title')}
        okText={t('Upload')}
        cancelText={t('cancel')}
        onOk={handleUpload}
        confirmLoading={uploadSkill.isPending}
        okButtonProps={{ disabled: uploadFileList.length === 0 }}
        destroyOnClose
      >
        <div className='py-4'>
          <Upload.Dragger {...uploadProps}>
            <p className='ant-upload-drag-icon'>
              <InboxOutlined />
            </p>
            <p className='text-base font-medium'>{t('skills_upload_dragger_text')}</p>
            <p className='text-sm text-gray-400 mt-1'>{t('skills_upload_format_tip')}</p>
          </Upload.Dragger>
        </div>
      </Modal>

      <Modal
        title={null}
        open={importModalVisible}
        onOk={handleGithubImport}
        onCancel={() => {
          setImportModalVisible(false);
          importForm.resetFields();
          setGithubUrlValue('');
        }}
        confirmLoading={importGithubSkill.isPending}
        okText={importGithubSkill.isPending ? t('skills_github_importing') : t('skills_import_github')}
        cancelText={t('cancel')}
        width={560}
        destroyOnClose
      >
        <div className='flex items-center gap-3 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 mb-4'>
          <div className='flex items-center justify-center w-10 h-10 rounded-xl' style={{ background: token.colorPrimaryBg }}>
            <GithubOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          </div>
          <div>
            <h3 className='text-base font-semibold text-gray-900 dark:text-white m-0 leading-tight'>
              {t('skills_import_modal_title')}
            </h3>
            <p className='text-xs text-gray-400 dark:text-gray-500 m-0 mt-0.5'>{t('skills_import_github_desc')}</p>
          </div>
        </div>

        <div
          className='rounded-lg px-3 py-2.5 mb-4'
          style={{
            background: token.colorInfoBg,
            borderLeft: `3px solid ${token.colorInfo}`,
          }}
        >
          <span className='text-xs leading-relaxed' style={{ color: token.colorInfoText }}>
            {t('skills_import_hint')}{' '}
            <code
              className='px-1 py-0.5 rounded text-[11px]'
              style={{
                background: token.colorInfoBgHover,
                color: token.colorInfoActive,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              SKILL.md
            </code>{' '}
            {t('skills_import_hint_suffix')}
          </span>
        </div>

        <Form form={importForm} layout='vertical'>
          <Form.Item
            name='github_url'
            label={
              <span className='font-medium text-sm text-gray-700 dark:text-gray-300'>
                {t('skills_import_folder_label')}
                <span className='font-normal text-gray-400 dark:text-gray-500 ml-1'>
                  {t('skills_import_folder_hint')}
                </span>
              </span>
            }
            rules={[{ required: true, message: t('skills_import_url_required') }]}
            className='mb-2'
            extra={
              <div className='mt-2 flex flex-col gap-1'>
                <span className='text-xs text-gray-400 dark:text-gray-500'>{t('skills_import_example_label')}</span>
                <code
                  className='text-xs px-2 py-1 rounded block w-fit'
                  style={{
                    background: token.colorFillQuaternary,
                    color: token.colorTextSecondary,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  https://github.com/owner/repo/tree/main
                </code>
                <code
                  className='text-xs px-2 py-1 rounded block w-fit'
                  style={{
                    background: token.colorFillQuaternary,
                    color: token.colorTextSecondary,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  https://github.com/owner/repo/tree/main/skills/my-skill
                </code>
              </div>
            }
          >
            <Input
              prefix={<GithubOutlined className='text-gray-400' />}
              placeholder='https://github.com/owner/repo/tree/main'
              size='large'
              value={githubUrlValue}
              onChange={e => setGithubUrlValue(e.target.value)}
              allowClear
              className='rounded-lg'
            />
          </Form.Item>

          {githubUrlValue.trim().length > 0 && (
            <div className='flex items-center gap-1.5 mt-1'>
              {isValidGithubUrl(githubUrlValue) ? (
                <>
                  <span className='inline-block w-1.5 h-1.5 rounded-full' style={{ background: token.colorSuccess }} />
                  <span className='text-xs' style={{ color: token.colorSuccess }}>
                    {t('skills_import_url_valid')}
                  </span>
                </>
              ) : (
                <>
                  <span className='inline-block w-1.5 h-1.5 rounded-full' style={{ background: token.colorWarning }} />
                  <span className='text-xs' style={{ color: token.colorWarning }}>
                    {t('skills_import_url_invalid')}
                  </span>
                </>
              )}
            </div>
          )}
        </Form>
      </Modal>
    </ConstructLayout>
  );
}
