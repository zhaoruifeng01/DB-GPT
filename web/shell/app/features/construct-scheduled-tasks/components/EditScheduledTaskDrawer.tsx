import { renderModelIcon } from '@/components/chat/header/model-selector';
import CronInput from '@/new-components/scheduled-task/CronInput';
import type { TaskResponse, UpdateTaskRequest } from '@/types/scheduled-task';
import { Button, Drawer, Form, Input, Select, Space, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUsableModels } from '~/features/construct-models/queries';
import { useUpdateScheduledTask } from '~/features/construct-scheduled-tasks/queries';

interface EditScheduledTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  task: TaskResponse | null;
  onSaved: () => void;
}

interface EditTaskFormValues {
  task_name: string;
  description?: string;
  user_input: string;
  model_name?: string;
}

const DEFAULT_CRON = '0 9 * * *';

export default function EditScheduledTaskDrawer({ open, onClose, task, onSaved }: EditScheduledTaskDrawerProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<EditTaskFormValues>();
  const [cron, setCron] = useState(DEFAULT_CRON);
  const updateTask = useUpdateScheduledTask();
  const { data: modelList = [] } = useUsableModels();

  useEffect(() => {
    if (task) {
      form.setFieldsValue({
        task_name: task.task_name,
        description: task.description ?? '',
        user_input: task.payload?.user_input ?? '',
        model_name: task.payload?.model_name ?? undefined,
      });
      setCron(task.cron_expression || DEFAULT_CRON);
    }
  }, [task, form]);

  const modelOptions = useMemo(
    () =>
      modelList.map(item => ({
        value: item,
        label: (
          <div className='flex items-center'>
            {renderModelIcon(item)}
            <span className='ml-2'>{item}</span>
          </div>
        ),
      })),
    [modelList],
  );

  const onSubmit = async () => {
    if (!task) return;
    try {
      const values = await form.validateFields();
      const patch: UpdateTaskRequest = {
        task_name: values.task_name,
        description: values.description || null,
      };
      if (cron !== task.cron_expression) {
        patch.cron_expression = cron;
      }
      if (values.user_input !== (task.payload?.user_input ?? '')) {
        patch.user_input = values.user_input;
      }
      if ((values.model_name ?? undefined) !== (task.payload?.model_name ?? undefined)) {
        patch.model_name = values.model_name || null;
      }
      await updateTask.mutateAsync({ taskId: task.task_id, body: patch });
      message.success(t('scheduled.msg.updated'));
      onSaved();
      onClose();
    } catch (err) {
      if (typeof err === 'object' && err && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : t('scheduled.msg.updateFailed'));
    }
  };

  return (
    <Drawer
      title={t('scheduled.edit.title')}
      open={open}
      onClose={onClose}
      destroyOnClose
      width={460}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>{t('scheduled.save.cancel')}</Button>
          <Button type='primary' loading={updateTask.isPending} onClick={onSubmit}>
            {t('scheduled.edit.save')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          task_name: task?.task_name ?? '',
          description: task?.description ?? '',
        }}
      >
        <Form.Item
          label={t('scheduled.save.nameLabel')}
          name='task_name'
          rules={[
            { required: true, message: t('scheduled.save.nameRequired') },
            { max: 256, message: t('scheduled.save.nameMax') },
          ]}
        >
          <Input placeholder={t('scheduled.save.namePlaceholder')} />
        </Form.Item>

        <Form.Item label={t('scheduled.save.descLabel')} name='description'>
          <Input.TextArea rows={2} placeholder={t('scheduled.save.descPlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('scheduled.edit.rawQuestionLabel')}
          name='user_input'
          rules={[{ required: true, message: t('scheduled.edit.rawQuestionRequired') }]}
        >
          <Input.TextArea rows={3} placeholder={t('scheduled.edit.rawQuestionPlaceholder')} />
        </Form.Item>

        <Form.Item label={t('scheduled.edit.modelLabel')} name='model_name'>
          <Select
            allowClear
            placeholder={t('scheduled.edit.modelPlaceholder')}
            popupMatchSelectWidth={false}
            options={modelOptions}
          />
        </Form.Item>

        <Form.Item label={t('scheduled.save.freqLabel')} required>
          <CronInput value={cron} onChange={setCron} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
