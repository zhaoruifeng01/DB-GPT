import DeptManagement from '@/components/permission/dept-management';
import RoleManagement from '@/components/permission/role-management';
import UserManagement from '@/components/permission/user-management';
import { readJSON, STORAGE_KEYS } from '@dbgpt/shared';
import { Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import ConstructLayout from '~/components/construct/ConstructLayout';

interface StoredUserInfo {
  role?: string;
}

export default function PermissionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = readJSON<StoredUserInfo>(STORAGE_KEYS.userInfo);
    if (user?.role === 'admin') {
      setIsAdmin(true);
    } else {
      navigate('/', { replace: true });
    }
    setChecking(false);
  }, [navigate]);

  if (checking || !isAdmin) return null;

  return (
    <ConstructLayout>
      <div className='px-6 py-4'>
        <Tabs
          defaultActiveKey='users'
          items={[
            { key: 'users', label: t('user_management'), children: <UserManagement /> },
            { key: 'roles', label: t('role_management'), children: <RoleManagement /> },
            { key: 'depts', label: t('dept_management'), children: <DeptManagement /> },
          ]}
        />
      </div>
    </ConstructLayout>
  );
}
