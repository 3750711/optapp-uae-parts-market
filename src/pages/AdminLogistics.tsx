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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ContainerStatus = 'sent_from_uae' | 'transit_iran' | 'to_kazakhstan' | 'customs' | 'cleared_customs' | 'received';

const ITEMS_PER_PAGE = 15; // Increased items per page

const AdminLogistics = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingContainer, setEditingContainer] = useState<string | null>(null);
  const [tempContainerNumber, setTempContainerNumber] = useState<string>('');
  const [bulkEditingContainer, setBulkEditingContainer] = useState(false);
  const [bulkContainerNumber, setBulkContainerNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['logistics-orders', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const [{ data: orders, error: ordersError }, { count: totalCount, error: countError }] = await Promise.all([
        supabase
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
          .order('created_at', { ascending: false })
          .range(from, to),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
      ]);

      if (ordersError) throw ordersError;
      if (countError) throw countError;

      return {
        orders,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / ITEMS_PER_PAGE)
      };
    }
  });

  const orders = ordersData?.orders || [];
  const totalPages = ordersData?.totalPages || 1;

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

  const handleUpdateContainerStatus = async (orderId: string, status: ContainerStatus) => {
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

  const getStatusColor = (status: ContainerStatus | null) => {
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

  const getStatusLabel = (status: ContainerStatus | null) => {
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

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const getCompactOrderInfo = (order: any) => {
    const buyer = order.buyer?.full_name || 'Не указано';
    const seller = order.seller?.full_name || 'Не указано';
    return {
      buyerInfo: `${buyer} ${order.buyer?.opt_id ? `(${order.buyer.opt_id})` : ''}`,
      sellerInfo: `${seller} ${order.seller?.opt_id ? `(${order.seller.opt_id})` : ''}`
    };
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle>Управление логистикой</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedOrders.length > 0 && (
              <div className="mb-4 p-3 border rounded-lg bg-muted/50 flex items-center gap-4 text-sm">
                <span>Выбрано: {selectedOrders.length}</span>
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
                      className="w-48 h-8 text-sm"
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={orders?.length === selectedOrders.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">№ заказа</TableHead>
                    <TableHead className="min-w-[200px]">Продавец</TableHead>
                    <TableHead className="min-w-[200px]">Покупатель</TableHead>
                    <TableHead className="w-[80px]">Мест</TableHead>
                    <TableHead className="w-[100px]">Цена дост.</TableHead>
                    <TableHead className="w-[120px]">Статус</TableHead>
                    <TableHead className="min-w-[150px]">Контейнер</TableHead>
                    <TableHead className="min-w-[180px]">Статус контейнера</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const { buyerInfo, sellerInfo } = getCompactOrderInfo(order);
                    return (
                      <TableRow key={order.id} className="text-sm">
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => handleSelectOrder(order.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{sellerInfo}</TableCell>
                        <TableCell>{buyerInfo}</TableCell>
                        <TableCell>{order.place_number}</TableCell>
                        <TableCell>
                          {order.delivery_price_confirm ? 
                            `$${order.delivery_price_confirm}` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          {editingContainer === order.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="text"
                                placeholder="№ контейнера"
                                defaultValue={order.container_number || ''}
                                autoFocus
                                onChange={(e) => setTempContainerNumber(e.target.value)}
                                className="w-28 h-8 text-sm"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
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
                              <span className="truncate max-w-[120px]">
                                {order.container_number || 'Не указан'}
                              </span>
                              <Container className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.container_status as ContainerStatus || 'sent_from_uae'}
                            onValueChange={(value) => handleUpdateContainerStatus(order.id, value as ContainerStatus)}
                          >
                            <SelectTrigger className={`w-[160px] h-8 text-sm ${getStatusColor(order.container_status as ContainerStatus)}`}>
                              <SelectValue>
                                {getStatusLabel(order.container_status as ContainerStatus)}
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
                            className="h-8 w-8"
                            onClick={() => handleViewDetails(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogistics;
