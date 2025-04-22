
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AdminOrderEditDialog } from './AdminOrderEditDialog';
import { AdminOrderDeleteDialog } from './AdminOrderDeleteDialog';
import { Database } from '@/integrations/supabase/types';
import { AdminOrderCard } from './AdminOrderCard';

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

interface AdminOrdersTableProps {
  orders: Order[];
}

export const AdminOrdersTable: React.FC<AdminOrdersTableProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setShowEditDialog(true);
  };

  const handleDelete = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <AdminOrderCard
            key={order.id}
            order={order}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <AdminOrderEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        order={selectedOrder}
      />

      <AdminOrderDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        order={selectedOrder}
      />
    </>
  );
};
