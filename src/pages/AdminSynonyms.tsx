import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { SynonymManager } from '@/components/admin/synonyms/SynonymManager';

const AdminSynonyms = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader title="Управление синонимами поиска" />
        <SynonymManager />
      </div>
    </AdminLayout>
  );
};

export default AdminSynonyms;