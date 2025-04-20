
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Edit2, Trash2, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminOrderEditDialog } from './AdminOrderEditDialog';
import { AdminOrderDeleteDialog } from './AdminOrderDeleteDialog';
import { Database } from '@/integrations/supabase/types';

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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№ заказа</TableHead>
              <TableHead>Наименование</TableHead>
              <TableHead>Продавец</TableHead>
              <TableHead>Покупатель</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.order_number}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{order.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.brand} {order.model}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{order.seller?.full_name || 'Не указано'}</div>
                    {order.seller?.opt_id && (
                      <Badge variant="outline" className="font-mono">
                        {order.seller.opt_id}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{order.buyer?.full_name || 'Не указано'}</div>
                    {order.buyer?.opt_id && (
                      <Badge variant="outline" className="font-mono">
                        {order.buyer.opt_id}
                      </Badge>
                    )}
                    {order.buyer?.telegram && (
                      <a
                        href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                      >
                        {order.buyer.telegram}
                        <Link className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.price} AED</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(order)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(order)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
