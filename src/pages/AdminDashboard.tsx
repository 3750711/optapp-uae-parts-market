
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import AdminMetricsSection from '@/components/admin/dashboard/AdminMetricsSection';
import AdminActionsSection from '@/components/admin/dashboard/AdminActionsSection';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { t } = useTranslation('admin');

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <DashboardHeader title={t('admin:dashboard.title')} />
        <AdminMetricsSection />
        <AdminActionsSection />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
