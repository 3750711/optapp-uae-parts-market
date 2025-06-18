
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { AdminFreeOrderForm } from '@/components/admin/order/AdminFreeOrderForm';
import { Card, CardContent } from '@/components/ui/card';

const AdminFreeOrder = () => {
  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <DashboardHeader title="Создание свободного заказа" />
        <Card>
          <CardContent className="pt-6">
            <AdminFreeOrderForm />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFreeOrder;
