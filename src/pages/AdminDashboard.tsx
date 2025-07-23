
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import AdminMetricsSection from '@/components/admin/dashboard/AdminMetricsSection';
import QuickActionsSection from '@/components/admin/dashboard/QuickActionsSection';
import AdminActionsSection from '@/components/admin/dashboard/AdminActionsSection';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader title="Админ панель" />
        <AdminMetricsSection />
        <QuickActionsSection />
        <AdminActionsSection />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
