import { apiInterceptors, createUser, deleteUser, listDepts, listRoles, listUsers, updateUser } from '@/client/api';
import { DeptResponse, RoleResponse, UserCreateRequest, UserResponse, UserUpdateRequest } from '@/types/permission';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Badge, Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function UserManagement() {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [depts, setDepts] = useState<DeptResponse[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchUsers = async (p = page, ps = pageSize) => {
    setLoading(true);
    const [, data] = await apiInterceptors(listUsers(p, ps));
    if (data) {
      setUsers(data.items);
      setTotal(data.total);
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    const [, data] = await apiInterceptors(listRoles());
    if (data) setRoles(data);
  };

  const fetchDepts = async () => {
    const [, data] = await apiInterceptors(listDepts());
    if (data) setDepts(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepts();
  }, []);

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [page, pageSize]);

  const flattenDepts = (deptList: DeptResponse[]): DeptResponse[] => {
    const result: DeptResponse[] = [];
    const traverse = (items: DeptResponse[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children?.length) traverse(item.children);
      });
    };
    traverse(deptList);
    return result;
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: UserResponse) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      real_name: record.real_name,
      phone: record.phone,
      role_ids: record.roles?.map(r => r.id) ?? [],
      dept_ids: record.departments?.map(d => d.id) ?? [],
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleDelete = (record: UserResponse) => {
    Modal.confirm({
      title: t('delete_confirm'),
      onOk: async () => {
        const [err] = await apiInterceptors(deleteUser(record.id));
        if (!err) {
          message.success(t('delete_success'));
          fetchUsers();
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingUser) {
        const payload: UserUpdateRequest = {
          email: values.email,
          real_name: values.real_name,
          phone: values.phone,
          role_ids: values.role_ids,
          dept_ids: values.dept_ids,
          status: values.status,
        };
        const [err] = await apiInterceptors(updateUser(editingUser.id, payload));
        if (!err) {
          message.success(t('update_success'));
          setModalOpen(false);
          fetchUsers();
        }
      } else {
        const payload: UserCreateRequest = {
          username: values.username,
          password: values.password,
          email: values.email,
          real_name: values.real_name,
          phone: values.phone,
          role_ids: values.role_ids ?? [],
          dept_ids: values.dept_ids ?? [],
        };
        const [err] = await apiInterceptors(createUser(payload));
        if (!err) {
          message.success(t('create_success'));
          setModalOpen(false);
          fetchUsers();
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
      title: t('username'),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: t('real_name'),
      dataIndex: 'real_name',
      key: 'real_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('phone'),
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: t('role_name'),
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: RoleResponse[]) => (
        <Space size={[0, 4]} wrap>
          {roles?.map(role => (
            <Tag key={role.id} color='blue'>
              {role.role_name}
            </Tag>
          ))}
        </Space>
      ),
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
      render: (_: unknown, record: UserResponse) => (
        <Space>
          <Button type='link' icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('edit_user')}
          </Button>
          <Button type='link' danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            {t('Delete')}
          </Button>
        </Space>
      ),
    },
  ];

  const allDepts = flattenDepts(depts);

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold dark:text-white'>{t('user_management')}</h2>
        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
          {t('add_user')}
        </Button>
      </div>

      <Table
        rowKey='id'
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={editingUser ? t('edit_user') : t('add_user')}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        destroyOnClose
      >
        <Form form={form} layout='vertical' preserve={false}>
          <Form.Item name='username' label={t('username')} rules={[{ required: true }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item name='password' label={t('password')} rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item name='real_name' label={t('real_name')}>
            <Input />
          </Form.Item>

          <Form.Item name='email' label='Email'>
            <Input />
          </Form.Item>

          <Form.Item name='phone' label={t('phone')}>
            <Input />
          </Form.Item>

          <Form.Item name='role_ids' label={t('role_name')}>
            <Select
              mode='multiple'
              placeholder={t('role_name')}
              options={roles.map(r => ({ label: r.role_name, value: r.id }))}
            />
          </Form.Item>

          <Form.Item name='dept_ids' label={t('dept_name')}>
            <Select
              mode='multiple'
              placeholder={t('dept_name')}
              options={allDepts.map(d => ({ label: d.dept_name, value: d.id }))}
            />
          </Form.Item>

          {editingUser && (
            <Form.Item name='status' label={t('status')}>
              <Select
                options={[
                  { label: t('enabled'), value: 1 },
                  { label: t('disabled'), value: 0 },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
