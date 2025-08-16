import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import * as XLSX from 'xlsx';
import { FileText, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Container, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
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
  Table as UITable,
  TableBody as UITableBody,
  TableCell as UITableCell,
  TableHead as UITableHead,
  TableHeader as UITableHeader,
  TableRow as UITableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { OrderPlacesManager } from "@/components/admin/logistics/OrderPlacesManager";
import { useOrderShipmentSummary } from "@/hooks/useOrderShipmentSummary";
import { Package } from "lucide-react";
import { SmartShipmentStatus } from "@/components/admin/logistics/SmartShipmentStatus";
import { ContainerManagement } from "@/components/admin/logistics/ContainerManagement";
import { useContainers } from '@/hooks/useContainers';
import { useOrderPlacesSync } from '@/hooks/useOrderPlacesSync';
import { ContainersList } from "@/components/admin/logistics/ContainersList";

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
  containers: {
    status: ContainerStatus | null;
  } | null;
};

type ContainerStatus = 'waiting' | 'sent_from_uae' | 'transit_iran' | 'to_kazakhstan' | 'customs' | 'cleared_customs' | 'received';
type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';

const ITEMS_PER_PAGE = 20;

type SortConfig = {
  field: keyof Order | null;
  direction: 'asc' | 'desc' | null;
};

const AdminLogistics = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingContainer, setEditingContainer] = useState<string | null>(null);
  const [tempContainerNumber, setTempContainerNumber] = useState<string>('');
  const [bulkEditingContainer, setBulkEditingContainer] = useState(false);
  const [bulkContainerNumber, setBulkContainerNumber] = useState('');
  const [bulkEditingShipmentStatus, setBulkEditingShipmentStatus] = useState(false);
  const [bulkShipmentStatus, setBulkShipmentStatus] = useState<ShipmentStatus>('not_shipped');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { containers, isLoading: containersLoading } = useContainers();
  const { syncShipmentsWithOrder } = useOrderPlacesSync();

  
  const [confirmContainerDialog, setConfirmContainerDialog] = useState(false);
  const [pendingContainerChange, setPendingContainerChange] = useState<{
    orderId?: string;
    number?: string;
    isBulk?: boolean;
  }>({});

  const [showExportHistory, setShowExportHistory] = useState(false);
  const [exportHistory, setExportHistory] = useState<Database['public']['Tables']['logistics_exports']['Row'][]>([]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  });

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [managingPlacesOrderId, setManagingPlacesOrderId] = useState<string | null>(null);
  const [showContainerManagement, setShowContainerManagement] = useState(false);

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
    queryKey: ['logistics-orders', sortConfig],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
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
          ),
           containers(
             status
           )
        `);

      if (sortConfig.field && sortConfig.direction) {
        query = query.order(sortConfig.field, { ascending: sortConfig.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: orders, error: ordersError } = await query.range(from, to);

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
    setUpdatingOrderId(orderId);
    
    try {
      await syncShipmentsWithOrder(orderId, undefined, containerNumber);
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      toast({
        title: "Успешно",
        description: "Номер контейнера обновлен",
      });
    } catch (error) {
      console.error('Error updating container:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить номер контейнера",
      });
    }
    
    setUpdatingOrderId(null);
  };

  const handleBulkUpdateContainerNumber = async () => {
    if (!selectedOrders.length || !bulkContainerNumber.trim()) return;

    let hasError = false;
    
    // Use the sync function to update orders and their shipments
    for (const orderId of selectedOrders) {
      try {
        await syncShipmentsWithOrder(orderId, undefined, bulkContainerNumber);
      } catch (error) {
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
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
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



  const getStatusColor = (status: ContainerStatus | null) => {
    switch (status) {
      case 'waiting':
        return 'text-yellow-600';
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
      case 'waiting':
        return 'Ожидание';
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

  const getShipmentStatusLabel = (status: ShipmentStatus | null) => {
    switch (status) {
      case 'not_shipped':
        return 'Не отправлен';
      case 'partially_shipped':
        return 'Частично отправлен';
      case 'in_transit':
        return 'Отправлен';
      default:
        return 'Не указан';
    }
  };

  const getShipmentStatusColor = (status: ShipmentStatus | null) => {
    switch (status) {
      case 'not_shipped':
        return 'text-red-600';
      case 'partially_shipped':
        return 'text-orange-600 font-semibold';
      case 'in_transit':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleBulkUpdateShipmentStatus = async () => {
    if (!selectedOrders.length) return;

    let hasError = false;
    
    // Use the sync function to update orders and their shipments
    for (const orderId of selectedOrders) {
      try {
        await syncShipmentsWithOrder(orderId, bulkShipmentStatus);
      } catch (error) {
        console.error('Error updating shipment status:', error);
        hasError = true;
      }
    }

    if (hasError) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статусы отгрузки для некоторых заказов",
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      toast({
        title: "Успешно",
        description: `Статус отгрузки обновлен для ${selectedOrders.length} заказов`,
      });
    }

    setBulkEditingShipmentStatus(false);
    setSelectedOrders([]);
  };

  const handleUpdateShipmentStatus = async (orderId: string, status: ShipmentStatus) => {
    setUpdatingOrderId(orderId);
    
    // Use sync function to update shipments
    try {
      await syncShipmentsWithOrder(orderId, status);
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      toast({
        title: "Успешно",
        description: "Статус отгрузки обновлен",
      });
    } catch (error) {
      console.error('Error updating shipment status:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статус отгрузки",
      });
    }
    
    setUpdatingOrderId(null);
  };

  const handleExportToXLSX = async () => {
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
        'Наименование': `${order.title} ${order.brand} ${order.model}`.trim(),
        'Количество мест для отправки': order.place_number,
        'Стоимость товара': order.price,
        'Стоимость доставки': order.delivery_price_confirm || 0,
        'OPT ID продавца': order.seller?.opt_id || 'Не указано',
        'OPT ID покупателя': order.buyer?.opt_id || 'Не указано',
        'Номер контейнера': order.container_number || 'Не указан',
        'Статус отгрузки': getShipmentStatusLabel(order.shipment_status as ShipmentStatus),
      }));

    const ws = XLSX.utils.json_to_sheet(selectedOrdersData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Заказы");
    
    const date = new Date().toISOString().replace(/:/g, '-');
    const filename = `orders_export_${date}.xlsx`;
    
    const file = new Blob([XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logistics-exports')
      .upload(filename, file, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сохранить файл экспорта",
      });
      return;
    }

    const { error: dbError } = await supabase
      .from('logistics_exports')
      .insert({
        file_name: filename,
        file_url: uploadData.path,
        created_by: profile?.id,
        order_count: selectedOrdersData.length
      });

    if (dbError) {
      console.error('Error saving export record:', dbError);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сохранить запись об экс��орте",
      });
    }

    XLSX.writeFile(wb, filename);

    toast({
      title: "Успешно",
      description: `Экспортировано ${selectedOrdersData.length} заказов`,
    });

    fetchExportHistory();
  };

  const downloadExportFile = async (fileUrl: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('logistics-exports')
      .download(fileUrl);

    if (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось скачать файл",
      });
      return;
    }

    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchExportHistory = async () => {
    const { data, error } = await supabase
      .from('logistics_exports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching export history:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить историю экспорта",
      });
    } else {
      setExportHistory(data || []);
    }
  };

  useEffect(() => {
    if (showExportHistory) {
      fetchExportHistory();
    }
  }, [showExportHistory]);

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


  const initiateContainerNumberChange = (orderId: string, number: string) => {
    setPendingContainerChange({ orderId, number, isBulk: false });
    setConfirmContainerDialog(true);
  };

  const initiateBulkContainerNumberChange = () => {
    setPendingContainerChange({ number: bulkContainerNumber, isBulk: true });
    setConfirmContainerDialog(true);
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

  const handleSort = (field: keyof Order) => {
    setSortConfig(current => ({
      field,
      direction: 
        current.field === field
          ? current.direction === 'asc'
            ? 'desc'
            : current.direction === 'desc'
              ? null
              : 'asc'
          : 'asc'
    }));
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-4">
        <Card>
          <CardHeader className="py-4 flex flex-row justify-between items-center">
            <CardTitle>Управление логистикой</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowContainerManagement(true)}
              >
                <Package className="h-4 w-4 mr-2" />
                Статусы контейнеров
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowExportHistory(true)}
              >
                История экспорта
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedOrders.length > 0 && (
              <div className="mb-4 p-3 border rounded-lg bg-muted/50 flex items-center gap-4 text-sm">
                <span>Выбрано: {selectedOrders.length}</span>
                <span className="font-medium">
                  Сумма доставки: {selectedOrdersDeliverySum?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
                {!bulkEditingContainer && !bulkEditingShipmentStatus ? (
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
                      onClick={() => setBulkEditingShipmentStatus(true)}
                      size="sm"
                    >
                      <Container className="h-4 w-4 mr-2" />
                      Изменить статус отгрузки
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleExportToXLSX}
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Экспорт в Excel
                    </Button>
                  </div>
                ) : bulkEditingShipmentStatus ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={bulkShipmentStatus}
                      onValueChange={(value) => setBulkShipmentStatus(value as ShipmentStatus)}
                    >
                      <SelectTrigger className="w-[200px] h-8 text-sm">
                        <SelectValue>{getShipmentStatusLabel(bulkShipmentStatus)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="not_shipped">Не отправлен</SelectItem>
                         {!orders.some(order => selectedOrders.includes(order.id) && order.place_number === 1) && (
                           <SelectItem value="partially_shipped">Частично отправлен</SelectItem>
                         )}
                         <SelectItem value="in_transit">Отправлен</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkUpdateShipmentStatus}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBulkEditingShipmentStatus(false)}
                    >
                      Отмена
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select
                      value={bulkContainerNumber || 'none'}
                      onValueChange={(value) => setBulkContainerNumber(value === 'none' ? '' : value)}
                    >
                      <SelectTrigger className="w-48 h-8 text-sm">
                        <SelectValue placeholder="Выберите контейнер" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не указан</SelectItem>
                        {containers?.map((container) => (
                          <SelectItem key={container.id} value={container.container_number}>
                            <div className="flex items-center justify-between w-full">
                              <span>{container.container_number}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                 ({getStatusLabel(container.status as any)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <TableHead 
                      className="w-[100px]"
                      sortable
                      sorted={sortConfig.field === 'order_number' ? sortConfig.direction : null}
                      onSort={() => handleSort('order_number')}
                    >
                      № заказа
                    </TableHead>
                    <TableHead 
                      className="min-w-[200px]"
                      sortable
                      sorted={sortConfig.field === 'seller_opt_id' ? sortConfig.direction : null}
                      onSort={() => handleSort('seller_opt_id')}
                    >
                      Продавец
                    </TableHead>
                    <TableHead 
                      className="min-w-[200px]"
                      sortable
                      sorted={sortConfig.field === 'buyer_opt_id' ? sortConfig.direction : null}
                      onSort={() => handleSort('buyer_opt_id')}
                    >
                      Покупатель
                    </TableHead>
                    <TableHead 
                      className="min-w-[200px]"
                      sortable
                      sorted={sortConfig.field === 'title' ? sortConfig.direction : null}
                      onSort={() => handleSort('title')}
                    >
                      Наименование
                    </TableHead>
                    <TableHead 
                      className="w-[100px]"
                      sortable
                      sorted={sortConfig.field === 'price' ? sortConfig.direction : null}
                      onSort={() => handleSort('price')}
                    >
                      Цена ($)
                    </TableHead>
                    <TableHead 
                      className="w-[80px]"
                      sortable
                      sorted={sortConfig.field === 'place_number' ? sortConfig.direction : null}
                      onSort={() => handleSort('place_number')}
                    >
                      Мест
                    </TableHead>
                    <TableHead 
                      className="w-[100px]"
                      sortable
                      sorted={sortConfig.field === 'delivery_price_confirm' ? sortConfig.direction : null}
                      onSort={() => handleSort('delivery_price_confirm')}
                    >
                      Цена дост.
                    </TableHead>
                    <TableHead 
                      className="w-[120px]"
                      sortable
                      sorted={sortConfig.field === 'status' ? sortConfig.direction : null}
                      onSort={() => handleSort('status')}
                    >
                      Статус
                    </TableHead>
                    <TableHead 
                      className="min-w-[150px]"
                      sortable
                      sorted={sortConfig.field === 'container_number' ? sortConfig.direction : null}
                      onSort={() => handleSort('container_number')}
                    >
                      Контейнер
                    </TableHead>
                     <TableHead 
                       className="min-w-[180px]"
                     >
                       Статус контейнера
                     </TableHead>
                    <TableHead 
                      className="min-w-[150px]"
                      sortable
                      sorted={sortConfig.field === 'shipment_status' ? sortConfig.direction : null}
                      onSort={() => handleSort('shipment_status')}
                    >
                      Статус отгрузки
                    </TableHead>
                    <TableHead className="w-[80px]"></TableHead>
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
                        <TableCell className="max-w-[200px] truncate" title={order.title}>
                          {order.title || 'Нет названия'}
                        </TableCell>
                        <TableCell>
                          {order.price ? 
                            order.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                            : '-'
                          }
                        </TableCell>
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
                               <Select
                 value={tempContainerNumber || order.container_number || 'none'}
                 onValueChange={(value) => setTempContainerNumber(value === 'none' ? '' : value)}
                               >
                                 <SelectTrigger className="w-32 h-8 text-sm">
                                   <SelectValue placeholder="Контейнер" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="none">Не указан</SelectItem>
                                   {containers?.map((container) => (
                                     <SelectItem key={container.id} value={container.container_number}>
                                       <div className="flex items-center justify-between w-full">
                                         <span>{container.container_number}</span>
                                         <span className="text-xs text-muted-foreground ml-2">
                                           ({getStatusLabel(container.status as any)})
                                         </span>
                                       </div>
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
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
                               className="cursor-pointer hover:text-primary"
                               onClick={() => {
                                 setEditingContainer(order.id);
                                 setTempContainerNumber(order.container_number || '');
                               }}
                             >
                               <ContainersList 
                                 orderId={order.id}
                                 fallbackContainerNumber={order.container_number}
                                 isPartiallyShipped={order.shipment_status === 'partially_shipped'}
                               />
                             </div>
                           )}
                         </TableCell>
                         <TableCell>
                           <div className={`text-sm ${getStatusColor(order.containers?.status as ContainerStatus)}`}>
                             {getStatusLabel(order.containers?.status as ContainerStatus)}
                          </div>
                        </TableCell>
                         <TableCell>
                           <SmartShipmentStatus
                             orderId={order.id}
                             fallbackStatus={(order.shipment_status as ShipmentStatus) || 'not_shipped'}
                             placeNumber={order.place_number || 1}
                             onStatusChange={(status) => handleUpdateShipmentStatus(order.id, status)}
                           />
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-1">
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8"
                               onClick={() => handleViewDetails(order.id)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                                {(order.shipment_status === 'partially_shipped' || order.shipment_status === 'not_shipped' || order.shipment_status === 'in_transit') && (
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8"
                                   onClick={() => setManagingPlacesOrderId(order.id)}
                                   title={order.shipment_status === 'partially_shipped' ? "Управлять местами" : "Просмотр мест"}
                                 >
                                   <Package className="h-4 w-4" />
                                 </Button>
                               )}
                           </div>
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
        
        {/* Order Places Manager Modal */}
        {managingPlacesOrderId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
              <OrderPlacesManager
                orderId={managingPlacesOrderId}
                onClose={() => setManagingPlacesOrderId(null)}
                readOnly={orders.find(o => o.id === managingPlacesOrderId)?.shipment_status !== 'partially_shipped'}
              />
            </div>
          </div>
        )}

        {/* Container Management Modal */}
        {showContainerManagement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <ContainerManagement onClose={() => setShowContainerManagement(false)} />
          </div>
        )}
      </div>

      <Dialog open={showExportHistory} onOpenChange={setShowExportHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>История экспорта</DialogTitle>
            <DialogDescription>
              Список ранее экспортированных файлов
            </DialogDescription>
          </DialogHeader>
          <UITable>
            <UITableHeader>
              <UITableRow>
                <UITableHead>Дата</UITableHead>
                <UITableHead>Название файла</UITableHead>
                <UITableHead>Количество заказов</UITableHead>
                <UITableHead>Действия</UITableHead>
              </UITableRow>
            </UITableHeader>
            <UITableBody>
              {exportHistory.map((export_item) => (
                <UITableRow key={export_item.id}>
                  <UITableCell>
                    {new Date(export_item.created_at).toLocaleString()}
                  </UITableCell>
                  <UITableCell>{export_item.file_name}</UITableCell>
                  <UITableCell>{export_item.order_count}</UITableCell>
                  <UITableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadExportFile(export_item.file_url, export_item.file_name)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Скачать
                    </Button>
                  </UITableCell>
                </UITableRow>
              ))}
            </UITableBody>
          </UITable>
        </DialogContent>
      </Dialog>


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
