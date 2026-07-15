import { apiInterceptors, createRole, deleteRole, listRoles, updateRole } from '@/client/api';
import { RoleRequest, RoleResponse } from '@/types/permission';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Badge, Button, Form, Input, Modal, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function RoleManagement() {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    const [, data] = await apiInterceptors(listRoles());
    if (data) setRoles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: RoleResponse) => {
    setEditingRole(record);
    form.setFieldsValue({
      role_code: record.role_code,
      role_name: record.role_name,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleDelete = (record: RoleResponse) => {
    Modal.confirm({
      title: t('delete_confirm'),
      onOk: async () => {
        const [err] = await apiInterceptors(deleteRole(record.id));
        if (!err) {
          message.success(t('delete_success'));
          fetchRoles();
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      const payload: RoleRequest = {
        role_code: values.role_code,
        role_name: values.role_name,
        description: values.description,
      };
      if (editingRole) {
        const [err] = await apiInterceptors(updateRole(editingRole.id, payload));
        if (!err) {
          message.success(t('update_success'));
          setModalOpen(false);
          fetchRoles();
        }
      } else {
        const [err] = await apiInterceptors(createRole(payload));
        if (!err) {
          message.success(t('create_success'));
          setModalOpen(false);
          fetchRoles();
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
      title: t('role_code'),
      dataIndex: 'role_code',
      key: 'role_code',
    },
    {
      title: t('role_name'),
      dataIndex: 'role_name',
      key: 'role_name',
    },
    {
      title: t('description'),
      dataIndex: 'description',
      key: 'description',
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
      render: (_: unknown, record: RoleResponse) => (
        <Space>
          <Button type='link' icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('edit_role')}
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
        <h2 className='text-lg font-semibold dark:text-white'>{t('role_management')}</h2>
        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
          {t('add_role')}
        </Button>
      </div>

      <Table rowKey='id' columns={columns} dataSource={roles} loading={loading} pagination={false} />

      <Modal
        title={editingRole ? t('edit_role') : t('add_role')}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        destroyOnClose
      >
        <Form form={form} layout='vertical' preserve={false}>
          <Form.Item name='role_code' label={t('role_code')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name='role_name' label={t('role_name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name='description' label={t('description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
