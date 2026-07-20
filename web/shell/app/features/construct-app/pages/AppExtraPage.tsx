import AppDefaultIcon from '@/new-components/common/AppDefaultIcon';
import type { CreateAppParams, IApp } from '@/types/app';
import { readJSON, STORAGE_KEYS, writeJSON } from '@dbgpt/shared';
import { EditOutlined, LeftOutlined } from '@ant-design/icons';
import { App, Button, Space, Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import CreateAppModal from '~/features/construct-app/components/create-app-modal';
import AwelLayout from '~/features/construct-app/components/extra/components/AwelLayout';
import NativeApp from '~/features/construct-app/components/extra/components/NativeApp';
import RecommendQuestions from '~/features/construct-app/components/extra/components/RecommendQuestions';
import AutoPlan from '~/features/construct-app/components/extra/components/auto-plan';
import styles from '~/features/construct-app/components/extra/styles.module.css';
import { useUpdateApp } from '~/features/construct-app/queries';

type AppDraft = IApp & { isEdit?: boolean };

function readStoredAppDraft(): AppDraft | null {
  return readJSON<AppDraft>(STORAGE_KEYS.appDraft);
}

export default function AppExtraPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const routeApp = (location.state as { app?: AppDraft } | null)?.app;
  const [curApp, setCurApp] = useState<AppDraft | null>(() => routeApp ?? readStoredAppDraft());
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const appParams = useRef<CreateAppParams>({});
  const initialParams = useRef<CreateAppParams>({});
  const updateApp = useUpdateApp();

  useEffect(() => {
    if (curApp) return;
    navigate('/construct/app', { replace: true });
  }, [curApp, navigate]);

  useEffect(() => {
    if (!curApp) return;
    try {
      initialParams.current = {
        app_code: curApp?.app_code,
        app_describe: curApp?.app_describe,
        team_mode: curApp?.team_mode,
        app_name: curApp?.app_name,
        language: curApp?.language,
        details: _.cloneDeep(curApp?.details || []),
        team_context: _.cloneDeep(curApp?.team_context || {}),
        param_need: _.cloneDeep(curApp?.param_need || []),
        recommend_questions: _.cloneDeep(curApp?.recommend_questions || []) as [],
      };

      appParams.current = _.cloneDeep(initialParams.current);
      setDataReady(true);
    } catch {
      message.error(t('Update_failure'));
    }
  }, [curApp, message, t]);

  const updateComponentData = (key: keyof CreateAppParams, value: unknown) => {
    appParams.current[key] = _.cloneDeep(value) as never;
  };

  const submit = async () => {
    if (!curApp) return;
    if (!dataReady || loading) {
      message.warning('Please wait, data is loading');
      return;
    }

    try {
      const finalParams: CreateAppParams = {
        app_code: curApp?.app_code,
        app_name: curApp?.app_name,
        app_describe: curApp?.app_describe,
        team_mode: curApp?.team_mode,
        language: curApp?.language,
      };

      if (['single_agent', 'auto_plan'].includes(curApp?.team_mode)) {
        finalParams.details = appParams.current.details || initialParams.current.details;
      }

      if (curApp?.team_mode === 'awel_layout') {
        finalParams.team_context = appParams.current.team_context || initialParams.current.team_context;
      }

      if (curApp?.team_mode === 'native_app') {
        finalParams.team_context = appParams.current.team_context || initialParams.current.team_context;
        finalParams.param_need = appParams.current.param_need || initialParams.current.param_need;
      }

      finalParams.recommend_questions = (appParams.current.recommend_questions ||
        initialParams.current.recommend_questions) as [];

      await updateApp.mutateAsync(finalParams);
      message.success(t('update_success'));
      navigate('/construct/app', { replace: true });
    } catch {
      message.error(t('update_failed'));
    }
  };

  const recommendQuestionsStyle = useMemo(() => {
    if (curApp?.team_mode === 'awel_layout') return 'px-6';
    if (curApp?.team_mode === 'auto_plan') return 'w-3/4 mx-auto';
    return 'w-3/5 mx-auto';
  }, [curApp?.team_mode]);

  if (!curApp) {
    return null;
  }

  return (
    <App>
      <Spin spinning={loading}>
        <div
          className={classNames(
            'flex flex-col h-dvh w-screen dark:bg-gradient-dark bg-gradient-light bg-cover bg-center',
            styles['extra-container'],
          )}
        >
          <header className='flex items-center justify-between px-6 py-2 h-14 border-b border-[#edeeef]'>
            <Space className='flex items-center'>
              <LeftOutlined
                className='text-base cursor-pointer hover:text-[#0c75fc]'
                onClick={() => navigate('/construct/app', { replace: true })}
              />
              <div className='flex items-center justify-center w-10 h-10 border border-[#d6d8da] rounded-lg'>
                <AppDefaultIcon scene={curApp?.team_context?.chat_scene || 'chat_agent'} />
              </div>
              <span>{curApp?.app_name}</span>
              <EditOutlined className='cursor-pointer hover:text-[#0c75fc]' onClick={() => setOpen(true)} />
            </Space>
            <Button type='primary' onClick={() => void submit()} loading={updateApp.isPending} disabled={loading}>
              {curApp?.isEdit ? t('update') : t('save')}
            </Button>
          </header>
          <div className='flex flex-1 flex-col py-12 max-h-full overflow-y-auto'>
            {['single_agent', 'auto_plan'].includes(curApp?.team_mode) && (
              <AutoPlan
                classNames='w-3/4 mx-auto'
                updateData={data => {
                  setLoading(Boolean(data?.[0]));
                  if (data?.[1]) updateComponentData('details', data[1]);
                }}
                initValue={curApp?.details}
                teamMode={curApp?.team_mode}
              />
            )}
            {curApp?.team_mode === 'awel_layout' && (
              <AwelLayout
                initValue={curApp?.team_context}
                updateData={data => {
                  setLoading(Boolean(data?.[0]));
                  if (data?.[1]) updateComponentData('team_context', data[1]);
                }}
                classNames='px-6'
              />
            )}
            {curApp?.team_mode === 'native_app' && (
              <NativeApp
                initValue={{
                  team_context: curApp?.team_context,
                  param_need: curApp?.param_need,
                }}
                classNames='w-3/5 mx-auto'
                updateData={data => {
                  setLoading(Boolean(data?.[0]));
                  if (data?.[1]) {
                    updateComponentData('team_context', data?.[1]?.[0]);
                    updateComponentData('param_need', data?.[1]?.[1]);
                  }
                }}
              />
            )}
            <RecommendQuestions
              updateData={data => {
                if (data) updateComponentData('recommend_questions', data);
              }}
              classNames={recommendQuestionsStyle}
              initValue={curApp?.recommend_questions || []}
              labelCol={curApp?.team_mode !== 'awel_layout'}
            />
          </div>
        </div>
      </Spin>
      <CreateAppModal
        type='edit'
        open={open}
        onCancel={() => {
          setOpen(false);
          const updated = readStoredAppDraft();
          if (updated) {
            setCurApp(updated);
            writeJSON(STORAGE_KEYS.appDraft, updated);
          }
        }}
      />
    </App>
  );
}
