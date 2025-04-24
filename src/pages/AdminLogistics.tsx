import React, { useState } from 'react';
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
import { Loader2, Eye, Container, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const AdminLogistics = () => {
  const navigate = useNavigate();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingContainer, setEditingContainer] = useState<string | null>(null);
  const [tempContainerNumber, setTempContainerNumber] = useState<string>('');
  const { toast } = useToast();

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

  const handleUpdateContainerNumber = async (orderId: string, containerNumber: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ container_number: containerNumber })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating container number:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить номер контейнера",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Номер контейнера обновлен",
      });
    }
    setEditingContainer(null);
    setTempContainerNumber('');
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    if (orders) {
      if (selectedOrders.length === orders.length) {
        setSelectedOrders([]);
      } else {
        setSelectedOrders(orders.map(order => order.id));
      }
    }
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
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={orders?.length === selectedOrders.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Номер заказа</TableHead>
                    <TableHead>Лот</TableHead>
                    <TableHead>Продавец</TableHead>
                    <TableHead>Покупатель</TableHead>
                    <TableHead>Количество мест</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Цена доставки</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Номер контейнера</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleSelectOrder(order.id)}
                        />
                      </TableCell>
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
                      <TableCell>{order.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                      <TableCell>
                        {order.delivery_price_confirm ? 
                          order.delivery_price_confirm.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 
                          'Не указана'
                        }
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {editingContainer === order.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="text"
                                placeholder="Введите номер контейнера"
                                defaultValue={order.container_number || ''}
                                autoFocus
                                onChange={(e) => setTempContainerNumber(e.target.value)}
                                className="w-32"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleUpdateContainerNumber(order.id, tempContainerNumber)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center space-x-2 cursor-pointer hover:text-primary"
                              onClick={() => {
                                setEditingContainer(order.id);
                                setTempContainerNumber(order.container_number || '');
                              }}
                            >
                              <span>
                                {order.container_number || 'Не отправлен'}
                              </span>
                              <Container className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
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
