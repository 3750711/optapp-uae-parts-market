import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import DashboardHeader from '@/components/admin/DashboardHeader';
import AdminMetricsSection from '@/components/admin/AdminMetricsSection';
import AdminActionsSection from '@/components/admin/AdminActionsSection';
import CloudinaryDataCleanup from '@/components/admin/CloudinaryDataCleanup';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader />
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
