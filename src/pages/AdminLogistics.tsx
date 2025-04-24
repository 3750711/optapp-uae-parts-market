
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";

const AdminLogistics = () => {
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['logistics-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (
            full_name,
            location,
            opt_id
          ),
          seller:profiles!orders_seller_id_fkey (
            full_name,
            location,
            opt_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleViewDetails = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Управление логистикой</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер заказа</TableHead>
                    <TableHead>Лот</TableHead>
                    <TableHead>Продавец</TableHead>
                    <TableHead>Покупатель</TableHead>
                    <TableHead>Количество мест</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{order.lot_number_order}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{order.seller?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            OPT ID: {order.seller?.opt_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{order.buyer?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            OPT ID: {order.buyer?.opt_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{order.place_number}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogistics;
