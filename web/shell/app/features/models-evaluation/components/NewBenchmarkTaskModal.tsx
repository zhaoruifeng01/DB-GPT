import { QuestionCircleOutlined } from '@ant-design/icons';
import { Form, Input, InputNumber, Modal, Radio, Select, Slider, Tooltip, App } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUsableModels } from '~/features/construct-models/queries';
import { useCreateBenchmarkTask } from '~/features/models-evaluation/queries';
import type { createBenchmarkTaskRequest } from '@/types/models_evaluation';

const { TextArea } = Input;

interface Props {
  open: boolean;
  onCancel: () => void;
}

interface BenchmarkFormValues {
  scene_value: string;
  evaluation_env: string;
  evaluation_type: 'LLM' | 'AGENT';
  model_list?: string[];
  temperature?: number;
  max_tokens?: number;
  api_url?: string;
  headers?: string;
  parse_strategy?: 'DIRECT' | 'JSON_PATH';
  response_mapping?: string;
  http_method?: string;
  timeout?: number;
}

function parseJSONObject(value: string | undefined, errorMessage: string): Record<string, unknown> {
  if (!value?.trim()) return {};
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(errorMessage);
  }
  return parsed as Record<string, unknown>;
}

export function NewBenchmarkTaskModal({ open, onCancel }: Props) {
  const [form] = Form.useForm<BenchmarkFormValues>();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { data: modelList = [], isFetching: modelLoading } = useUsableModels();
  const createTask = useCreateBenchmarkTask();
  const [evaluationType, setEvaluationType] = useState<'LLM' | 'AGENT'>('LLM');
  const [parseStrategy, setParseStrategy] = useState<'DIRECT' | 'JSON_PATH'>('JSON_PATH');

  const modelOptions = modelList.map(item => ({
    label: item,
    value: item,
  }));

  async function submit(values: BenchmarkFormValues) {
    if (values.evaluation_type === 'LLM') {
      const params: createBenchmarkTaskRequest = {
        scene_value: values.scene_value,
        model_list: values.model_list,
        temperature: values.temperature,
        max_tokens: values.max_tokens,
        benchmark_type: values.evaluation_type,
        evaluation_env: values.evaluation_env,
      };
      await createTask.mutateAsync(params);
      return;
    }

    const headers = parseJSONObject(values.headers, 'Header信息格式不正确,请输入有效的JSON格式');
    const responseMapping =
      values.parse_strategy === 'JSON_PATH'
        ? parseJSONObject(values.response_mapping, 'Response Mapping配置格式不正确,请输入有效的JSON格式')
        : {};

    await createTask.mutateAsync({
      scene_value: values.scene_value,
      benchmark_type: values.evaluation_type,
      evaluation_env: values.evaluation_env,
      api_url: values.api_url,
      headers,
      parse_strategy: values.parse_strategy,
      response_mapping: responseMapping,
      http_method: values.http_method || 'POST',
      timeout: values.timeout || 300,
    });
  }

  async function handleOk() {
    try {
      const values = await form.validateFields();
      await submit(values);
      message.success(t('create_evaluation_success'));
      form.resetFields();
      setEvaluationType('LLM');
      setParseStrategy('JSON_PATH');
      onCancel();
    } catch (error) {
      const err = error instanceof Error ? error.message : '';
      if (err) {
        message.error(`${t('create_evaluation_failed')}: ${err}`);
      }
    }
  }

  function handleCancel() {
    form.resetFields();
    setEvaluationType('LLM');
    setParseStrategy('JSON_PATH');
    onCancel();
  }

  return (
    <Modal
      title={t('new_evaluation_task')}
      open={open}
      onOk={() => void handleOk()}
      onCancel={handleCancel}
      confirmLoading={createTask.isPending}
      width={600}
    >
      <Form
        form={form}
        layout='vertical'
        requiredMark={false}
        initialValues={{
          temperature: 0.6,
          evaluation_type: 'LLM',
          parse_strategy: 'JSON_PATH',
          http_method: 'POST',
          timeout: 300,
          evaluation_env: 'DEV',
        }}
      >
        <Form.Item
          label={t('task_name')}
          name='scene_value'
          rules={[{ required: true, message: t('please_input_task_name') }]}
        >
          <Input placeholder={t('please_input_task_name')} />
        </Form.Item>

        <Form.Item
          label={t('evaluation_env')}
          name='evaluation_env'
          rules={[{ required: true, message: t('please_select_evaluation_env') }]}
        >
          <Radio.Group>
            <Radio value='DEV'>
              {t('evaluation_env_dev')}{' '}
              <Tooltip title={t('evaluation_env_dev_tooltip')}>
                <QuestionCircleOutlined style={{ color: '#999', cursor: 'help' }} />
              </Tooltip>
            </Radio>
            <Radio value='TEST'>
              {t('evaluation_env_test')}{' '}
              <Tooltip title={t('evaluation_env_test_tooltip')}>
                <QuestionCircleOutlined style={{ color: '#999', cursor: 'help' }} />
              </Tooltip>
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={t('evaluation_type')}
          name='evaluation_type'
          rules={[{ required: true, message: t('please_select_evaluation_type') }]}
        >
          <Radio.Group
            value={evaluationType}
            onChange={(event: RadioChangeEvent) => setEvaluationType(event.target.value as 'LLM' | 'AGENT')}
          >
            <Radio value='LLM'>{t('evaluate_model')}</Radio>
            <Radio value='AGENT'>{t('evaluate_agent')}</Radio>
          </Radio.Group>
        </Form.Item>

        {evaluationType === 'LLM' && (
          <>
            <Form.Item
              label={t('models_to_evaluate')}
              name='model_list'
              rules={[
                { required: true, message: t('please_select_models_to_evaluate') },
                { type: 'array', min: 1, message: t('please_select_at_least_one_model') },
              ]}
            >
              <Select
                mode='multiple'
                placeholder={t('please_select_models_to_evaluate')}
                options={modelOptions}
                loading={modelLoading}
                showSearch
                optionFilterProp='label'
                allowClear
              />
            </Form.Item>

            <Form.Item
              label={t('temperature')}
              name='temperature'
              rules={[{ required: true, message: t('please_input_temperature') }]}
            >
              <Slider min={0} max={1} step={0.1} marks={{ 0: '0', 0.5: '0.5', 1: '1' }} />
            </Form.Item>

            <Form.Item label={t('max_new_tokens')} name='max_tokens'>
              <InputNumber
                min={1}
                max={32768}
                style={{ width: '100%' }}
                placeholder={t('please_input_max_new_tokens')}
              />
            </Form.Item>
          </>
        )}

        {evaluationType === 'AGENT' && (
          <>
            <Form.Item
              label={t('api_url')}
              name='api_url'
              rules={[
                { required: true, message: t('please_input_api_url') },
                { type: 'url', message: t('please_input_valid_url') },
              ]}
            >
              <Input placeholder={t('api_url_placeholder')} />
            </Form.Item>

            <Form.Item
              label={t('http_method')}
              name='http_method'
              rules={[{ required: true, message: t('please_select_http_method') }]}
            >
              <Select placeholder={t('please_select_http_method')}>
                <Select.Option value='GET'>GET</Select.Option>
                <Select.Option value='POST'>POST</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label={t('header_info')} name='headers'>
              <TextArea rows={4} placeholder={t('header_info_placeholder')} />
            </Form.Item>

            <Form.Item
              label={t('parse_strategy')}
              name='parse_strategy'
              rules={[{ required: true, message: t('please_select_parse_strategy') }]}
            >
              <Select
                value={parseStrategy}
                onChange={value => setParseStrategy(value)}
                placeholder={t('please_select_parse_strategy')}
              >
                <Select.Option value='DIRECT'>{t('parse_strategy_direct')}</Select.Option>
                <Select.Option value='JSON_PATH'>{t('parse_strategy_json_path')}</Select.Option>
              </Select>
            </Form.Item>

            {parseStrategy === 'JSON_PATH' && (
              <Form.Item
                label={t('response_mapping')}
                name='response_mapping'
                rules={[{ required: true, message: t('please_input_response_mapping') }]}
              >
                <TextArea rows={4} placeholder={t('response_mapping_placeholder')} />
              </Form.Item>
            )}

            <Form.Item
              label={t('api_timeout')}
              name='timeout'
              rules={[
                { required: true, message: t('please_input_api_timeout') },
                { type: 'number', min: 1, max: 2000, message: t('timeout_range_validation') },
              ]}
            >
              <InputNumber min={1} max={300000} style={{ width: '100%' }} placeholder={t('api_timeout_placeholder')} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
