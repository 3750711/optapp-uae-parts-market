
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { AdminFreeOrderForm } from '@/components/admin/order/AdminFreeOrderForm';

const AdminFreeOrder = () => {
  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <DashboardHeader title="Создание свободного заказа" />
        <AdminFreeOrderForm />
      </div>
    </AdminLayout>
  );
};

export default AdminFreeOrder;
