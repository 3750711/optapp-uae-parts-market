import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminLogistics = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingContainer, setEditingContainer] = useState<string | null>(null);
  const [tempContainerNumber, setTempContainerNumber] = useState<string>('');
  const [bulkEditingContainer, setBulkEditingContainer] = useState(false);
  const [bulkContainerNumber, setBulkContainerNumber] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  const selectedOrdersDeliverySum = orders
    ?.filter(order => selectedOrders.includes(order.id))
    .reduce((sum, order) => sum + (order.delivery_price_confirm || 0), 0);

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

  const handleBulkUpdateContainerNumber = async () => {
    if (!selectedOrders.length || !bulkContainerNumber.trim()) return;

    let hasError = false;
    
    for (const orderId of selectedOrders) {
      const { error } = await supabase
        .from('orders')
        .update({ container_number: bulkContainerNumber })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating container number:', error);
        hasError = true;
      }
    }

    if (hasError) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить номера контейнеров для некоторых заказов",
      });
    } else {
      toast({
        title: "Успешно",
        description: `Номер контейнера обновлен для ${selectedOrders.length} заказов`,
      });
    }

    setBulkEditingContainer(false);
    setBulkContainerNumber('');
    setSelectedOrders([]);
  };

  const handleUpdateContainerStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ container_status: status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating container status:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статус контейнера",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Статус контейнера обновлен",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'sent_from_uae':
        return 'text-blue-600';
      case 'transit_iran':
        return 'text-orange-600';
      case 'to_kazakhstan':
        return 'text-yellow-600';
      case 'customs':
        return 'text-red-600';
      case 'cleared_customs':
        return 'text-purple-600';
      case 'received':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'sent_from_uae':
        return 'Отправлен из ОАЭ';
      case 'transit_iran':
        return 'Транзит Иран';
      case 'to_kazakhstan':
        return 'Следует в Казахстан';
      case 'customs':
        return 'Таможня';
      case 'cleared_customs':
        return 'Вышел с таможни';
      case 'received':
        return 'Получен';
      default:
        return 'Не указан';
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
            {selectedOrders.length > 0 && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/50 flex items-center gap-4">
                <span>Выбрано заказов: {selectedOrders.length}</span>
                <span className="font-medium">
                  Сумма доставки: {selectedOrdersDeliverySum?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
                {!bulkEditingContainer ? (
                  <Button
                    variant="secondary"
                    onClick={() => setBulkEditingContainer(true)}
                    size="sm"
                  >
                    <Container className="h-4 w-4 mr-2" />
                    Изменить номер контейнера
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Введите номер контейнера"
                      value={bulkContainerNumber}
                      onChange={(e) => setBulkContainerNumber(e.target.value)}
                      className="w-48"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkUpdateContainerNumber}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </Button>
                  </div>
                )}
              </div>
            )}
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
                    <TableHead>Наименование</TableHead>
                    <TableHead>Лот</TableHead>
                    <TableHead>Продавец</TableHead>
                    <TableHead>Покупатель</TableHead>
                    <TableHead>Количество мест</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Цена доставки</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Номер контейнера</TableHead>
                    <TableHead>Статус контейнера</TableHead>
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
                      <TableCell>{order.title}</TableCell>
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
                        <Select
                          value={order.container_status || 'waiting'}
                          onValueChange={(value) => handleUpdateContainerStatus(order.id, value)}
                        >
                          <SelectTrigger className={`w-[200px] ${getStatusColor(order.container_status)}`}>
                            <SelectValue>
                              {getStatusLabel(order.container_status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sent_from_uae">Отправлен из ОАЭ</SelectItem>
                            <SelectItem value="transit_iran">Транзит Иран</SelectItem>
                            <SelectItem value="to_kazakhstan">Следует в Казахстан</SelectItem>
                            <SelectItem value="customs">Таможня</SelectItem>
                            <SelectItem value="cleared_customs">Вышел с таможни</SelectItem>
                            <SelectItem value="received">Получен</SelectItem>
                          </SelectContent>
                        </Select>
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
