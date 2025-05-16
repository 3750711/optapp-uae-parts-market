
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import AdminMetricsSection from '@/components/admin/dashboard/AdminMetricsSection';
import AdminActionsSection from '@/components/admin/dashboard/AdminActionsSection';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <DashboardHeader title="Обзор системы" />
        <AdminMetricsSection />
        <AdminActionsSection />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
