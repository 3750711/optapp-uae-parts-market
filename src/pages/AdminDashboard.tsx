
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import AdminMetricsSection from '@/components/admin/dashboard/AdminMetricsSection';
import AdminActionsSection from '@/components/admin/dashboard/AdminActionsSection';
import { AdminErrorBoundary } from '@/components/error/AdminErrorBoundary';

const AdminDashboard = () => {
  return (
    <AdminErrorBoundary>
      <AdminLayout>
        <div className="space-y-6">
          <DashboardHeader title="Админ панель" />
          <AdminMetricsSection />
          <AdminActionsSection />
        </div>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;
