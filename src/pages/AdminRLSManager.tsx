
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import RLSPolicyManager from '@/components/admin/RLSPolicyManager';

const AdminRLSManager = () => {
  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <DashboardHeader 
          title="Управление RLS политиками" 
          description="Контроль политик безопасности Row Level Security"
        />
        <RLSPolicyManager />
      </div>
    </AdminLayout>
  );
};

export default AdminRLSManager;
