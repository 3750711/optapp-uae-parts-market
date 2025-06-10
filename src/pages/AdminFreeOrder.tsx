
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { AdminFreeOrderForm } from '@/components/admin/order/AdminFreeOrderForm';
import { Card, CardContent } from '@/components/ui/card';
import { AdminErrorBoundary } from '@/components/error/AdminErrorBoundary';

const AdminFreeOrder = () => {
  return (
    <AdminLayout>
      <AdminErrorBoundary>
        <div className="space-y-4 md:space-y-6">
          <DashboardHeader title="Создание свободного заказа" />
          <Card>
            <CardContent className="pt-6">
              <AdminFreeOrderForm />
            </CardContent>
          </Card>
        </div>
      </AdminErrorBoundary>
    </AdminLayout>
  );
};

export default AdminFreeOrder;
