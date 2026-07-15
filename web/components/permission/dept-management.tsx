import { apiInterceptors, createDept, deleteDept, listDepts, updateDept } from '@/client/api';
import { DeptRequest, DeptResponse } from '@/types/permission';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Badge, Button, Form, Input, InputNumber, Modal, Space, Table, TreeSelect, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TreeNode {
  title: string;
  value: number;
  key: number;
  children?: TreeNode[];
}

function buildTreeData(depts: DeptResponse[]): TreeNode[] {
  return depts.map(dept => ({
    title: dept.dept_name,
    value: dept.id,
    key: dept.id,
    children: dept.children?.length ? buildTreeData(dept.children) : undefined,
  }));
}

function findDeptName(depts: DeptResponse[], id: number): string {
  for (const dept of depts) {
    if (dept.id === id) return dept.dept_name;
    if (dept.children?.length) {
      const found = findDeptName(dept.children, id);
      if (found) return found;
    }
  }
  return '-';
}

export default function DeptManagement() {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [depts, setDepts] = useState<DeptResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DeptResponse | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchDepts = async () => {
    setLoading(true);
    const [, data] = await apiInterceptors(listDepts());
    if (data) setDepts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const treeData = useMemo(() => buildTreeData(depts), [depts]);

  const handleAdd = () => {
    setEditingDept(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: DeptResponse) => {
    setEditingDept(record);
    form.setFieldsValue({
      dept_name: record.dept_name,
      dept_code: record.dept_code,
      parent_id: record.parent_id || undefined,
      order_num: 0,
    });
    setModalOpen(true);
  };

  const handleDelete = (record: DeptResponse) => {
    Modal.confirm({
      title: t('delete_confirm'),
      onOk: async () => {
        const [err] = await apiInterceptors(deleteDept(record.id));
        if (!err) {
          message.success(t('delete_success'));
          fetchDepts();
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      const payload: DeptRequest = {
        dept_name: values.dept_name,
        dept_code: values.dept_code,
        parent_id: values.parent_id ?? 0,
        order_num: values.order_num ?? 0,
      };
      if (editingDept) {
        const [err] = await apiInterceptors(updateDept(editingDept.id, payload));
        if (!err) {
          message.success(t('update_success'));
          setModalOpen(false);
          fetchDepts();
        }
      } else {
        const [err] = await apiInterceptors(createDept(payload));
        if (!err) {
          message.success(t('create_success'));
          setModalOpen(false);
          fetchDepts();
        }
      }
    } catch {
      // validation failed
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: t('dept_name'),
      dataIndex: 'dept_name',
      key: 'dept_name',
    },
    {
      title: t('dept_code'),
      dataIndex: 'dept_code',
      key: 'dept_code',
    },
    {
      title: t('parent_dept'),
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parentId: number) => (parentId ? findDeptName(depts, parentId) : '-'),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Badge status={status === 1 ? 'success' : 'error'} text={status === 1 ? t('enabled') : t('disabled')} />
      ),
    },
    {
      title: t('operation'),
      key: 'action',
      render: (_: unknown, record: DeptResponse) => (
        <Space>
          <Button type='link' icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('edit_dept')}
          </Button>
          <Button type='link' danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            {t('Delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold dark:text-white'>{t('dept_management')}</h2>
        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
          {t('add_dept')}
        </Button>
      </div>

      <Table rowKey='id' columns={columns} dataSource={depts} loading={loading} pagination={false} />

      <Modal
        title={editingDept ? t('edit_dept') : t('add_dept')}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        destroyOnClose
      >
        <Form form={form} layout='vertical' preserve={false}>
          <Form.Item name='dept_name' label={t('dept_name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name='dept_code' label={t('dept_code')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name='parent_id' label={t('parent_dept')}>
            <TreeSelect allowClear treeData={treeData} placeholder={t('parent_dept')} treeDefaultExpandAll />
          </Form.Item>

          <Form.Item name='order_num' label='Order'>
            <InputNumber min={0} className='w-full' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
