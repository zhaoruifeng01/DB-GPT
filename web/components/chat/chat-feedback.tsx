import { ChatContext } from '@/app/chat-context';
import { apiInterceptors, getChatFeedBackItme, postChatFeedBackForm } from '@/client/api';
import { FeedBack } from '@/types/chat';
import { ChatFeedBackSchema } from '@/types/db';
import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popover, Select, Slider, Space, Tooltip, message } from 'antd';
import { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

type Props = {
  conv_index: number;
  question: any;
  knowledge_space: string;
  select_param?: FeedBack;
};

const ChatFeedback = ({ conv_index, question, knowledge_space, select_param }: Props) => {
  const { t } = useTranslation();
  const { chatId } = useContext(ChatContext);
  const [ques_type, setQuesType] = useState('');
  const [score, setScore] = useState(4);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        apiInterceptors(getChatFeedBackItme(chatId, conv_index))
          .then(res => {
            const finddata = res[1] ?? {};
            setQuesType(finddata.ques_type ?? '');
            setScore(parseInt(finddata.score ?? '4'));
            setText(finddata.messages ?? '');
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        setQuesType('');
        setScore(4);
        setText('');
      }
      setOpen(newOpen);
    },
    [chatId, conv_index],
  );

  const marks: Record<number, string> = {
    0: t('Lowest'),
    1: t('Missed'),
    2: t('Lost'),
    3: t('Incorrect'),
    4: t('Verbose'),
    5: t('Best'),
  };

  const handleSubmit = () => {
    const formData: ChatFeedBackSchema = {
      conv_uid: chatId,
      conv_index: conv_index,
      question: question,
      knowledge_space: knowledge_space,
      score: score,
      ques_type: ques_type,
      messages: text,
    };

    apiInterceptors(
      postChatFeedBackForm({
        data: formData,
      }),
    )
      .then(() => {
        messageApi.open({ type: 'success', content: 'save success' });
        setOpen(false);
      })
      .catch(() => {
        messageApi.open({ type: 'error', content: 'save error' });
      });
  };

  const selectOptions = select_param
    ? Object.entries(select_param).map(([key, label]) => ({ value: key, label }))
    : [];

  const content = (
    <Card size='small' className='w-[350px]' bordered={false}>
      {contextHolder}
      <Space direction='vertical' className='w-full' size='middle'>
        <div className='grid grid-cols-13 gap-2'>
          <div className='col-span-3 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded px-2 py-3 text-sm'>
            {t('Q_A_Category')}
          </div>
          <div className='col-span-10'>
            <Select
              value={ques_type || undefined}
              placeholder='Choose one...'
              onChange={value => setQuesType(value || '')}
              options={selectOptions}
              className='w-full'
              allowClear
              onClear={() => setQuesType('')}
            />
          </div>

          <div className='col-span-3 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded px-2 py-3 text-sm'>
            <Tooltip title={t('feed_back_desc')} placement='left'>
              {t('Q_A_Rating')}
            </Tooltip>
          </div>
          <div className='col-span-10 px-4 py-2'>
            <Slider
              min={0}
              max={5}
              step={1}
              value={score}
              onChange={value => setScore(value)}
              marks={marks}
              tooltip={{ formatter: value => (value !== undefined ? marks[value] : '') }}
            />
          </div>

          <div className='col-span-13'>
            <TextArea
              placeholder={t('Please_input_the_text')}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              className='w-full'
              showCount
              maxLength={500}
            />
          </div>

          <div className='col-span-13'>
            <Button type='primary' onClick={handleSubmit} className='w-full'>
              {t('submit')}
            </Button>
          </div>
        </div>
      </Space>
    </Card>
  );

  return (
    <Popover content={content} open={open} onOpenChange={handleOpenChange} trigger='click' placement='bottomRight'>
      <Tooltip title={t('Rating')}>
        <Button type='text' icon={<EllipsisOutlined />} className='rounded-full' />
      </Tooltip>
    </Popover>
  );
};

export default ChatFeedback;
