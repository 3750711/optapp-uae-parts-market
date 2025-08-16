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
import { CompactShipmentInfo } from "@/components/admin/logistics/CompactShipmentInfo";
import { DynamicShipmentStatus } from "@/components/admin/logistics/DynamicShipmentStatus";
import { OrderShipmentStatusChecker } from "@/components/admin/logistics/OrderShipmentStatusChecker";

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
  const [bulkEditingContainerStatus, setBulkEditingContainerStatus] = useState(false);
  const [bulkContainerStatus, setBulkContainerStatus] = useState<ContainerStatus>('sent_from_uae');
  const [bulkEditingShipmentStatus, setBulkEditingShipmentStatus] = useState(false);
  const [bulkShipmentStatus, setBulkShipmentStatus] = useState<ShipmentStatus>('not_shipped');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

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

  const [showExportHistory, setShowExportHistory] = useState(false);
  const [exportHistory, setExportHistory] = useState<Database['public']['Tables']['logistics_exports']['Row'][]>([]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  });

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [managingPlacesOrderId, setManagingPlacesOrderId] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      toast({
        title: "Успешно",
        description: "Номер контейнера обновлен",
      });
    }
    
    setUpdatingOrderId(null);
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
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      toast({
        title: "Успешно",
        description: `Статус контейнера обновлен для ${selectedOrders.length} заказов`,
      });
    }

    setBulkEditingContainerStatus(false);
    setSelectedOrders([]);
  };

  const handleUpdateContainerStatus = async (orderId: string, status: ContainerStatus) => {
    setUpdatingOrderId(orderId);
    
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
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      toast({
        title: "Успешно",
        description: "Статус контейнера обновлен",
      });
    }
    
    setUpdatingOrderId(null);
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

    // If status is partially_shipped, we need to handle multiple orders differently
    if (bulkShipmentStatus === 'partially_shipped') {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Статус 'Частично отправлен' можно установить только для отдельных заказов",
      });
      setBulkEditingShipmentStatus(false);
      return;
    }

    let hasError = false;
    
    for (const orderId of selectedOrders) {
      const { error } = await supabase
        .from('orders')
        .update({ shipment_status: bulkShipmentStatus })
        .eq('id', orderId);

      if (error) {
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
    
    // If status is partially_shipped, open the places manager instead
    if (status === 'partially_shipped') {
      setManagingPlacesOrderId(orderId);
      setUpdatingOrderId(null);
      return;
    }
    
    const { error } = await supabase
      .from('orders')
      .update({ shipment_status: status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating shipment status:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статус отгрузки",
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      toast({
        title: "Успешно",
        description: "Статус отгрузки обновлен",
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
            <Button
              variant="secondary"
              onClick={() => setShowExportHistory(true)}
            >
              История экспорта
            </Button>
          </CardHeader>
          <CardContent>
            {selectedOrders.length > 0 && (
              <div className="mb-4 p-3 border rounded-lg bg-muted/50 flex items-center gap-4 text-sm">
                <span>Выбрано: {selectedOrders.length}</span>
                <span className="font-medium">
                  Сумма доставки: {selectedOrdersDeliverySum?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
                {!bulkEditingContainer && !bulkEditingContainerStatus && !bulkEditingShipmentStatus ? (
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
                         <SelectItem value="partially_shipped">Частично отправлен</SelectItem>
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
                      sortable
                      sorted={sortConfig.field === 'container_status' ? sortConfig.direction : null}
                      onSort={() => handleSort('container_status')}
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
                           <div className="space-y-1">
                             <DynamicShipmentStatus
                               orderId={order.id}
                               fallbackStatus={(order.shipment_status as ShipmentStatus) || 'not_shipped'}
                               onStatusChange={(status) => handleUpdateShipmentStatus(order.id, status)}
                             />
                             <CompactShipmentInfo orderId={order.id} placeNumber={order.place_number || 1} />
                           </div>
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
                             <OrderShipmentStatusChecker
                               orderId={order.id}
                               fallbackStatus={(order.shipment_status as ShipmentStatus) || 'not_shipped'}
                             >
                               {(calculatedStatus, hasShipments) => (
                                 (calculatedStatus === 'partially_shipped' || (order.place_number && order.place_number > 1) || hasShipments) && (
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8"
                                     onClick={() => setManagingPlacesOrderId(order.id)}
                                     title="Управлять местами"
                                   >
                                     <Package className="h-4 w-4" />
                                   </Button>
                                 )
                               )}
                             </OrderShipmentStatusChecker>
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
              />
            </div>
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
