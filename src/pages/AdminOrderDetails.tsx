
import React from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import OrderDetails from '@/pages/OrderDetails';

const AdminOrderDetails = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Ошибка</h1>
            <p className="text-gray-600 mt-2">ID заказа не указан</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <OrderDetails />
    </AdminLayout>
  );
};

export default AdminOrderDetails;
