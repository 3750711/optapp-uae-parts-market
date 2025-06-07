
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import AdminMetricsSection from '@/components/admin/dashboard/AdminMetricsSection';
import AdminActionsSection from '@/components/admin/dashboard/AdminActionsSection';
import CloudinaryDataCleanup from '@/components/admin/CloudinaryDataCleanup';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader title="Админ панель" />
        <AdminMetricsSection />
        <AdminActionsSection />
        
        {/* Add Cloudinary Data Cleanup Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Обслуживание Cloudinary</h2>
          <CloudinaryDataCleanup />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
