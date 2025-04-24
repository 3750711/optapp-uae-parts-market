import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import * as XLSX from 'xlsx';
import { FileText, QrCode, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Container, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    full_name: string | null;
    location: string | null;
    opt_id: string | null;
  } | null;
  seller: {
    full_name: string | null;
    location: string | null;
    opt_id: string | null;
  } | null;
};

type ContainerStatus = 'sent_from_uae' | 'transit_iran' | 'to_kazakhstan' | 'customs' | 'cleared_customs' | 'received';

const ITEMS_PER_PAGE = 20;

const AdminLogistics = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingContainer, setEditingContainer] = useState<string | null>(null);
  const [tempContainerNumber, setTempContainerNumber] = useState<string>('');
  const [bulkEditingContainer, setBulkEditingContainer] = useState(false);
  const [bulkContainerNumber, setBulkContainerNumber] = useState('');
  const [bulkEditingContainerStatus, setBulkEditingContainerStatus] = useState(false);
  const [bulkContainerStatus, setBulkContainerStatus] = useState<ContainerStatus>('sent_from_uae');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [confirmStatusDialog, setConfirmStatusDialog] = useState(false);
  const [confirmContainerDialog, setConfirmContainerDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    orderId?: string;
    status?: ContainerStatus;
    isBulk?: boolean;
  }>({});
  const [pendingContainerChange, setPendingContainerChange] = useState<{
    orderId?: string;
    number?: string;
    isBulk?: boolean;
  }>({});

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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['logistics-orders'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: orders, error: ordersError } = await supabase
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
        .range(from, to);

      if (ordersError) throw ordersError;
      return orders as Order[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === ITEMS_PER_PAGE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const orders = data?.pages.flat() || [];

  const selectedOrdersDeliverySum = orders
    ?.filter(order => selectedOrders.includes(order.id))
    .reduce((sum, order) => sum + (order.delivery_price_confirm || 0), 0);

  const handleViewDetails = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleUpdateContainerNumber = async (orderId: string, containerNumber: string) => {
    setEditingContainer(null);
    setTempContainerNumber('');
    
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

  const handleBulkUpdateContainerStatus = async () => {
    if (!selectedOrders.length) return;

    let hasError = false;
    
    for (const orderId of selectedOrders) {
      const { error } = await supabase
        .from('orders')
        .update({ container_status: bulkContainerStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating container status:', error);
        hasError = true;
      }
    }

    if (hasError) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статусы контейнеров для некоторых заказов",
      });
    } else {
      toast({
        title: "Успешно",
        description: `Статус контейнера обновлен для ${selectedOrders.length} заказов`,
      });
    }

    setBulkEditingContainerStatus(false);
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

  const handleExportToXLSX = () => {
    if (selectedOrders.length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите заказы для экспорта",
      });
      return;
    }

    const selectedOrdersData = orders
      .filter(order => selectedOrders.includes(order.id))
      .map(order => ({
        'Номер заказа': order.order_number,
        'Продавец': order.seller?.full_name || 'Не указано',
        'ID продавца': order.seller?.opt_id || 'Не указано',
        'Покупатель': order.buyer?.full_name || 'Не указано',
        'ID покупателя': order.buyer?.opt_id || 'Не указано',
        'Количество мест': order.place_number,
        'Цена доставки': order.delivery_price_confirm || '-',
        'Статус': order.status,
        'Номер контейнера': order.container_number || 'Не указан',
        'Статус контейнера': getStatusLabel(order.container_status as ContainerStatus),
      }));

    const ws = XLSX.utils.json_to_sheet(selectedOrdersData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Заказы");
    
    const date = new Date().toISOString().split('T')[0];
    
    XLSX.writeFile(wb, `orders_export_${date}.xlsx`);

    toast({
      title: "Успешно",
      description: `Экспортировано ${selectedOrdersData.length} заказов`,
    });
  };

  const handleExportToPDF = async () => {
    if (selectedOrders.length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите заказы для экспорта",
      });
      return;
    }

    try {
      const [QRCode, jsPDF] = await Promise.all([
        import('qrcode'),
        import('jspdf')
      ]);

      const pdf = new jsPDF.default();
      let yOffset = 10;

      for (const orderId of selectedOrders) {
        const order = orders.find(o => o.id === orderId);
        if (!order) continue;

        const qrDataUrl = await QRCode.toDataURL(`https://preview--optapp-uae-parts-market.lovable.app/order/${order.id}`);

        pdf.setFontSize(12);
        pdf.text(`Заказ #${order.order_number}`, 10, yOffset);
        pdf.text(`Продавец: ${order.seller?.full_name || 'Не указано'}`, 10, yOffset + 7);
        pdf.text(`Покупатель: ${order.buyer?.full_name || 'Не указано'}`, 10, yOffset + 14);
        pdf.text(`Контейнер: ${order.container_number || 'Не указан'}`, 10, yOffset + 21);
        pdf.text(`Статус: ${getStatusLabel(order.container_status as ContainerStatus)}`, 10, yOffset + 28);
        
        pdf.addImage(qrDataUrl, 'PNG', 150, yOffset, 40, 40);

        yOffset += 60;

        if (yOffset > 250) {
          pdf.addPage();
          yOffset = 10;
        }
      }

      const date = new Date().toISOString().split('T')[0];
      pdf.save(`orders_qr_${date}.pdf`);

      toast({
        title: "Успешно",
        description: `Экспортировано ${selectedOrders.length} заказов в PDF`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось создать PDF файл",
      });
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

  const getCompactOrderInfo = (order: Order) => {
    const buyer = order.buyer?.full_name || 'Не указано';
    const seller = order.seller?.full_name || 'Не указано';
    return {
      buyerInfo: `${buyer} ${order.buyer?.opt_id ? `(${order.buyer.opt_id})` : ''}`,
      sellerInfo: `${seller} ${order.seller?.opt_id ? `(${order.seller.opt_id})` : ''}`
    };
  };

  const initiateContainerStatusChange = (orderId: string, status: ContainerStatus) => {
    setPendingStatusChange({ orderId, status, isBulk: false });
    setConfirmStatusDialog(true);
  };

  const initiateBulkContainerStatusChange = () => {
    setPendingStatusChange({ status: bulkContainerStatus, isBulk: true });
    setConfirmStatusDialog(true);
  };

  const initiateContainerNumberChange = (orderId: string, number: string) => {
    setPendingContainerChange({ orderId, number, isBulk: false });
    setConfirmContainerDialog(true);
  };

  const initiateBulkContainerNumberChange = () => {
    setPendingContainerChange({ number: bulkContainerNumber, isBulk: true });
    setConfirmContainerDialog(true);
  };

  const handleConfirmedStatusChange = async () => {
    if (pendingStatusChange.isBulk) {
      await handleBulkUpdateContainerStatus();
    } else if (pendingStatusChange.orderId && pendingStatusChange.status) {
      await handleUpdateContainerStatus(pendingStatusChange.orderId, pendingStatusChange.status);
    }
    setConfirmStatusDialog(false);
    setPendingStatusChange({});
  };

  const handleConfirmedContainerChange = async () => {
    if (pendingContainerChange.isBulk) {
      await handleBulkUpdateContainerNumber();
    } else if (pendingContainerChange.orderId && pendingContainerChange.number) {
      await handleUpdateContainerNumber(pendingContainerChange.orderId, pendingContainerChange.number);
    }
    setConfirmContainerDialog(false);
    setPendingContainerChange({});
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
                {!bulkEditingContainer && !bulkEditingContainerStatus ? (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setBulkEditingContainer(true)}
                      size="sm"
                    >
                      <Container className="h-4 w-4 mr-2" />
                      Изменить номер контейнера
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setBulkEditingContainerStatus(true)}
                      size="sm"
                    >
                      <Container className="h-4 w-4 mr-2" />
                      Изменить статус контейнера
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleExportToXLSX}
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Экспорт в Excel
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleExportToPDF}
                      size="sm"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Экспорт в PDF с QR
                    </Button>
                  </div>
                ) : bulkEditingContainerStatus ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={bulkContainerStatus}
                      onValueChange={(value) => setBulkContainerStatus(value as ContainerStatus)}
                    >
                      <SelectTrigger className="w-[200px] h-8 text-sm">
                        <SelectValue>{getStatusLabel(bulkContainerStatus)}</SelectValue>
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={initiateBulkContainerStatusChange}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBulkEditingContainerStatus(false)}
                    >
                      Отмена
                    </Button>
                  </div>
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
                      onClick={initiateBulkContainerNumberChange}
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
                        checked={orders?.length > 0 && orders.length === selectedOrders.length}
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
                                onClick={() => initiateContainerNumberChange(order.id, tempContainerNumber)}
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
                            value={(order.container_status as ContainerStatus) || 'sent_from_uae'}
                            onValueChange={(value) => initiateContainerStatusChange(order.id, value as ContainerStatus)}
                          >
                            <SelectTrigger className={`w-[160px] h-8 text-sm ${getStatusColor(order.container_status as ContainerStatus)}`}>
                              <SelectValue>
                                {getStatusLabel(order.container_status as ContainerStatus)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sent_from_uae">Отправле�� из ОАЭ</SelectItem>
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
            <div ref={loadMoreRef} className="py-4 text-center">
              {isFetchingNextPage ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : hasNextPage ? (
                <div className="text-sm text-muted-foreground">
                  Прокрутите вниз для загрузки дополнительных заказов
                </div>
              ) : orders.length > 0 ? (
                <div className="text-sm text-muted-foreground">
                  Все заказы загружены
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmStatusDialog} onOpenChange={setConfirmStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите изменение статуса</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange.isBulk 
                ? `Вы уверены, что хотите изменить статус контейнера для ${selectedOrders.length} заказов?`
                : 'Вы уверены, что хотите изменить статус контейнера?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusChange({})}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedStatusChange}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmContainerDialog} onOpenChange={setConfirmContainerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите изменение номера контейнера</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingContainerChange.isBulk 
                ? `Вы уверены, что хотите изменить номер контейнера для ${selectedOrders.length} заказов?`
                : 'Вы уверены, что хотите изменить номер контейнера?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingContainerChange({})}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedContainerChange}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminLogistics;
