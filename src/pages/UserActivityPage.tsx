import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserActivityDashboard } from '@/components/user-activity/UserActivityDashboard';
import { ExportDataButton } from '@/components/user-activity/ExportDataButton';

const UserActivityPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Активность пользователей</h1>
            <p className="text-muted-foreground mt-2">
              Мониторинг действий пользователей в реальном времени
            </p>
          </div>
          <ExportDataButton />
        </div>

        <UserActivityDashboard />
      </div>
    </AdminLayout>
  );
};

export default UserActivityPage;
