import DeptManagement from '@/components/permission/dept-management';
import RoleManagement from '@/components/permission/role-management';
import UserManagement from '@/components/permission/user-management';
import ConstructLayout from '@/new-components/layout/Construct';
import { STORAGE_USERINFO_KEY } from '@/utils/constants/index';
import { Tabs } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function Permission() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_USERINFO_KEY) ?? '{}');
      if (user?.role === 'admin') {
        setIsAdmin(true);
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
    setChecking(false);
  }, []);

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

export default Permission;
