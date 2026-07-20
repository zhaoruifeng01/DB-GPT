/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreateAppParams, IApp, TeamMode } from '@/types/app';
import { readJSON, STORAGE_KEYS, writeJSON } from '@dbgpt/shared';
import { App, ConfigProvider, Divider, Form, Input, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { constructAppApi } from '~/features/construct-app/api';
import { useCreateApp, useTeamModes, useUpdateApp } from '~/features/construct-app/queries';
import styles from './styles.module.css';

interface WorkModeSelectProps {
  disable: boolean;
  options: TeamMode[];
  value?: TeamMode;
  onChange?: (value: TeamMode) => void;
}

// 自定义team_mode选择
const WorkModeSelect: React.FC<WorkModeSelectProps> = ({ disable = false, options = [], value, onChange }) => {
  const [selected, setSelected] = useState<TeamMode>(value || ({} as TeamMode));
  const { i18n } = useTranslation();

  const returnOptionStyle = (item: TeamMode) => {
    if (disable) {
      return classNames(
        `flex items-center p-4 border rounded-lg border-[#d9d9d9]  cursor-not-allowed relative transition-all duration-500 ease-in-out`,
        {
          'bg-[rgba(0,0,0,0.04)] dark:bg-[#606264]': item.value === selected?.value,
        },
      );
    }
    return `flex items-center p-4  border dark:border-[rgba(217,217,217,0.85)] rounded-lg cursor-pointer hover:border-[#0c75fc] hover:bg-[#f5faff] dark:hover:border-[rgba(12,117,252,0.85)] dark:hover:bg-[#606264] relative transition-all duration-300 ease-in-out ${
      item.value === selected?.value
        ? 'border-[#0c75fc] bg-[#f5faff] dark:bg-[#606264] dark:border-[#0c75fc]'
        : 'border-[#d9d9d9]'
    } `;
  };
  const language = i18n.language === 'en';

  return (
    <div className='grid grid-cols-2 gap-4'>
      {options.map(item => (
        <div
          className={returnOptionStyle(item)}
          key={item.value}
          onClick={() => {
            if (disable) {
              return;
            }
            setSelected(item);
            onChange?.({ ...value, ...item });
          }}
        >
          <img src={`/icons/app/${item.value}.png`} width={48} height={48} alt={item.value} />
          <div className='flex flex-col ml-3'>
            <span className='text-xs font-medium text-[rgba(0,0,0,0.85)] dark:text-[rgba(255,255,255,0.85)] first-line:leading-6'>
              {language ? item.name_en : item.name_cn}
            </span>
            <span className='text-xs text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.85)]'>
              {language ? item.description_en : item.description}
            </span>
          </div>
          {item.value === selected?.value && (
            <div
              className='w-3 h-3 rounded-tr-md absolute top-[1px] right-[1px] transition-all duration-300 ease-in-out'
              style={{
                background: `linear-gradient(to right top, transparent 50%, transparent 50%, ${disable ? '#d0d0d0' : '#0c75fc'} 0)`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const CreateAppModal: React.FC<{
  open: boolean;
  onCancel: () => void;
  refresh?: () => void | Promise<unknown>;
  type?: 'add' | 'edit';
}> = ({ open, onCancel, type = 'add', refresh }) => {
  const { t, i18n } = useTranslation();
  const appInfo = readJSON<IApp & { isEdit?: boolean }>(STORAGE_KEYS.appDraft) || ({} as IApp);
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const teamMode = Form.useWatch('team_mode', form);

  const navigate = useNavigate();
  const language = i18n.language === 'en';
  const createAppMutation = useCreateApp();
  const updateAppMutation = useUpdateApp();

  // 获取工作模式列表
  const { data = [], isLoading: loading } = useTeamModes();

  const submitApp = async (params: CreateAppParams) => {
    try {
      if (type === 'edit') {
        await updateAppMutation.mutateAsync({
          app_code: appInfo?.app_code,
          language: 'zh',
          ...params,
        });
        const list = await constructAppApi.list({});
        const curApp = list?.app_list?.find(item => item.app_code === appInfo?.app_code);
        writeJSON(STORAGE_KEYS.appDraft, { ...(curApp || appInfo), isEdit: true });
        message.success(t('Update_successfully'));
      } else {
        const created = await createAppMutation.mutateAsync({
          language: 'zh',
          ...params,
        });
        message.success(t('Create_successfully'));
        writeJSON(STORAGE_KEYS.appDraft, created);
        navigate('/construct/app/extra', { state: { app: created } });
      }
      await refresh?.();
      onCancel();
    } catch {
      message.error(type === 'edit' ? t('Update_failure') : t('Create_failure'));
    }
  };

  const mode = useMemo(() => {
    return data?.filter(item => item.value === appInfo?.team_mode)?.[0];
  }, [appInfo, data]);

  if (loading) {
    return null;
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            defaultBorderColor: '#d9d9d9',
          },
        },
      }}
    >
      <Modal
        className={styles['create-app-modal-container']}
        title={t('create_app')}
        width={900}
        open={open}
        onOk={() => {
          form.validateFields().then(async (values: any) => {
            await submitApp({
              app_name: values?.app_name,
              app_describe: values?.app_describe,
              team_mode: values?.team_mode?.value,
            });
          });
        }}
        onCancel={onCancel}
        centered={true}
      >
        <Spin spinning={createAppMutation.isPending || updateAppMutation.isPending}>
          <div className='flex flex-1'>
            <Form
              layout='vertical'
              className='w-3/5'
              form={form}
              initialValues={{
                team_mode: mode || data?.[0],
                app_name: appInfo?.app_name,
                app_describe: appInfo?.app_describe,
              }}
            >
              <Form.Item
                label={t('team_modal')}
                name='team_mode'
                required
                rules={[{ required: true, message: t('Please_input_the_work_modal') }]}
              >
                <WorkModeSelect disable={type === 'edit'} options={data || []} />
              </Form.Item>
              <Form.Item
                label={`${t('app_name')}：`}
                name='app_name'
                required
                rules={[{ required: true, message: t('input_app_name') }]}
              >
                <Input placeholder={t('input_app_name')} autoComplete='off' className='h-8' />
              </Form.Item>
              <Form.Item
                label={`${t('Description')}：`}
                name='app_describe'
                required
                rules={[
                  {
                    required: true,
                    message: t('Please_input_the_description'),
                  },
                ]}
              >
                <Input.TextArea
                  autoComplete='off'
                  placeholder={t('Please_input_the_description')}
                  autoSize={{ minRows: 2.5 }}
                />
              </Form.Item>
              {/* <Form.Item label="应用图标：" name="app_icon" valuePropName="fileList">
              <Upload listType="picture-card">
                <button style={{ border: 0, background: 'none' }} type="button">
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图标</div>
                </button>
              </Upload>
            </Form.Item> */}
            </Form>
            <Divider type='vertical' className='h-auto mx-6 bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.5)] ' />
            <div className='flex flex-col w-2/5 pl-6 pt-8 '>
              <span className='text-base text-[rgba(0,0,0,0.85)] font-medium mb-6 dark:text-[rgba(255,255,255,0.85)]'>
                {language ? teamMode?.name_en : teamMode?.name_cn}
              </span>
              <div className='flex items-start'>
                <span className='flex flex-shrink-0 w-1 h-1 rounded-full bg-[rgba(0,0,0,0.45)] mt-2 mr-1 dark:bg-[rgba(255,255,255,0.65)]' />
                <span className='text-xs leading-5 text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.65)]'>
                  {language ? teamMode?.remark_en : teamMode?.remark}
                </span>
              </div>
            </div>
          </div>
        </Spin>
      </Modal>
    </ConfigProvider>
  );
};

export default CreateAppModal;
