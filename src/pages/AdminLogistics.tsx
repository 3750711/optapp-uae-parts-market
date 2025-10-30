import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import * as XLSX from 'xlsx';
import { FileText, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useResizableColumns } from '@/hooks/useResizableColumns';
import { ResizableTableHead } from '@/components/ui/resizable-table-head';
import { useAdminLogisticsState } from '@/hooks/useAdminLogisticsState';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Container, Save, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
// useDebounce removed - search now applied manually via button
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
import { ContainerEditableWrapper } from "@/components/admin/logistics/ContainerEditableWrapper";
import { useBatchOrderShipmentSummary } from '@/hooks/useBatchOrderShipmentSummary';
import { LogisticsFilters } from "@/components/admin/logistics/LogisticsFilters";
import { LogisticsFilters as LogisticsFiltersType, FilterOption } from "@/types/logisticsFilters";
import { useServerFilteredOrders, Order } from "@/hooks/useServerFilteredOrders";
import { useOrdersStatistics } from "@/hooks/useOrdersStatistics";
import { useQuery } from "@tanstack/react-query";
import { VirtualizedLogisticsTable } from "@/components/admin/logistics/VirtualizedLogisticsTable";

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
  const { toast } = useToast();
  const { profile } = useAuth();
  const { containers, isLoading: containersLoading } = useContainers();
  const { syncShipmentsWithOrder } = useOrderPlacesSync();

  // Resizable columns (минимальные ширины для opt_id и сокращенных статусов)
  const DEFAULT_COLUMN_WIDTHS = {
    checkbox: 40,
    orderNumber: 90,
    seller: 55,
    buyer: 55,
    title: 230,
    price: 90,
    placeNumber: 45,
    deliveryPrice: 90,
    orderStatus: 110,
    readyForShipment: 50,
    containerNumber: 65,
    containerStatus: 55,
    shipmentStatus: 95,
    actions: 95,
  };

  const { columnWidths, handleResize, resetWidths } = useResizableColumns(
    'admin-logistics-table',
    DEFAULT_COLUMN_WIDTHS
  );

  
  const [confirmContainerDialog, setConfirmContainerDialog] = useState(false);
  const [pendingContainerChange, setPendingContainerChange] = useState<{
    orderId?: string;
    number?: string;
    isBulk?: boolean;
  }>({});

  const [showExportHistory, setShowExportHistory] = useState(false);
  const [exportHistory, setExportHistory] = useState<Database['public']['Tables']['logistics_exports']['Row'][]>([]);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [managingPlacesOrderId, setManagingPlacesOrderId] = useState<string | null>(null);
  const [showContainerManagement, setShowContainerManagement] = useState(false);

  // Use hook for filters and sorting with localStorage persistence
  const {
    pendingFilters,
    setPendingFilters,
    appliedFilters,
    sortConfig,
    hasUnappliedChanges,
    hasUnappliedSearch,
    handleApplyFilters: handleApplyFiltersFromHook,
    handleApplySearch,
    handleClearSearch,
    handleClearFilters,
    handleRemoveFilter,
    handleSortChange
  } = useAdminLogisticsState();

  // Wrap handleApplyFilters to also clear selection
  const handleApplyFilters = () => {
    handleApplyFiltersFromHook();
    setSelectedOrders([]);
  };

  // Search now applied manually via button - no debounce

  // Auto-refresh logistics data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['logistics-orders-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['orders-statistics'] });
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [queryClient]);

  // Server-side filtered orders
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useServerFilteredOrders(appliedFilters, sortConfig);

  const orders = data?.pages.flatMap(page => page.orders) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Debug: track orders data updates
  useEffect(() => {
    console.log('📊 [Orders] Data updated:', {
      pages: data?.pages.length || 0,
      totalOrders: totalCount,
      loadedOrders: orders.length,
      appliedSearchTerm: appliedFilters.searchTerm
    });
  }, [data, appliedFilters.searchTerm, orders.length, totalCount]);


  // Debug: track hasNextPage changes
  useEffect(() => {
    console.log('🔄 [Pagination Status]', {
      hasNextPage,
      isFetchingNextPage,
      loadedOrders: orders.length,
      totalCount,
      pages: data?.pages.length || 0
    });
  }, [hasNextPage, isFetchingNextPage, orders.length, totalCount, data?.pages.length]);

  // Batch fetch shipment summaries for all orders to solve N+1 problem
  const orderIds = orders.map(order => order.id);
  const { data: shipmentSummaries } = useBatchOrderShipmentSummary({
    orderIds,
    enabled: orderIds.length > 0
  });

  // Get unique sellers and buyers from ALL profiles (not just loaded orders)
  const { data: uniqueSellers } = useQuery({
    queryKey: ['unique-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('user_type', 'seller')
        .order('full_name');
      
      if (error) throw error;
      
      return (data || []).map(seller => ({
        value: seller.id,
        label: seller.opt_id ? `${seller.opt_id} - ${seller.full_name || 'Без имени'}` : (seller.full_name || 'Без имени'),
        count: undefined
      }));
    }
  });

  const { data: uniqueBuyers } = useQuery({
    queryKey: ['unique-buyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('user_type', 'buyer')
        .order('full_name');
      
      if (error) throw error;
      
      return (data || []).map(buyer => ({
        value: buyer.id,
        label: buyer.opt_id ? `${buyer.opt_id} - ${buyer.full_name || 'Без имени'}` : (buyer.full_name || 'Без имени'),
        count: undefined
      }));
    }
  });

  // Prepare container options for filter
  const containerOptions: FilterOption[] = useMemo(() => {
    return (containers || []).map(container => ({
      value: container.container_number,
      label: container.container_number,
      count: undefined
    }));
  }, [containers]);

  // Apply filters - now using server-side statistics
  const { data: stats } = useOrdersStatistics(appliedFilters);

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

    const BATCH_SIZE = 10;
    const errors: string[] = [];
    let processed = 0;
    const totalOrders = selectedOrders.length;

    // Process in batches
    for (let i = 0; i < totalOrders; i += BATCH_SIZE) {
      const batch = selectedOrders.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(orderId => 
          syncShipmentsWithOrder(orderId, undefined, bulkContainerNumber)
        )
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error('Error updating container:', result.reason);
          errors.push(batch[index]);
        } else {
          processed++;
        }
      });

      // Show progress toast
      const currentProgress = Math.min(i + BATCH_SIZE, totalOrders);
      toast({
        title: "Обработка...",
        description: `Обработано ${currentProgress} из ${totalOrders} заказов`,
      });

      // Small pause between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < totalOrders) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });

    // Show final result
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Частичная ошибка",
        description: `Успешно обновлено: ${processed}. Ошибок: ${errors.length}`,
      });
    } else {
      toast({
        title: "Успешно",
        description: `Контейнер обновлен для ${processed} заказов`,
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
    // Сокращенные названия для минимальной ширины столбцов
    switch (status) {
      case 'waiting':
        return 'Ожид.';
      case 'sent_from_uae':
        return 'ОАЭ';
      case 'transit_iran':
        return 'Иран';
      case 'to_kazakhstan':
        return 'КЗ';
      case 'customs':
        return 'Там.';
      case 'cleared_customs':
        return 'Выш.';
      case 'received':
        return 'Получ.';
      default:
        return 'N/A';
    }
  };

  const getShipmentStatusLabel = (status: ShipmentStatus | null) => {
    // Сокращенные названия для минимальной ширины столбцов
    switch (status) {
      case 'not_shipped':
        return 'Не отпр.';
      case 'partially_shipped':
        return 'Частич.';
      case 'in_transit':
        return 'Отправ.';
      default:
        return 'N/A';
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

    const BATCH_SIZE = 10;
    const errors: string[] = [];
    let processed = 0;
    const totalOrders = selectedOrders.length;

    // Process in batches
    for (let i = 0; i < totalOrders; i += BATCH_SIZE) {
      const batch = selectedOrders.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(orderId => 
          syncShipmentsWithOrder(orderId, bulkShipmentStatus)
        )
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error('Error updating shipment status:', result.reason);
          errors.push(batch[index]);
        } else {
          processed++;
        }
      });

      // Show progress toast
      const currentProgress = Math.min(i + BATCH_SIZE, totalOrders);
      toast({
        title: "Обработка...",
        description: `Обработано ${currentProgress} из ${totalOrders} заказов`,
      });

      // Small pause between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < totalOrders) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });

    // Show final result
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Частичная ошибка",
        description: `Успешно обновлено: ${processed}. Ошибок: ${errors.length}`,
      });
    } else {
      toast({
        title: "Успешно",
        description: `Статус отгрузки обновлен для ${processed} заказов`,
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

  const handleToggleReadyForShipment = async (orderId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ ready_for_shipment: !currentValue })
        .eq('id', orderId);

      if (error) throw error;

      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ['logistics-orders-filtered'] });
      
      toast({
        title: "Успешно",
        description: `Статус готовности ${!currentValue ? 'установлен' : 'снят'}`,
      });
    } catch (error) {
      console.error('Error updating ready_for_shipment:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статус готовности",
      });
    }
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
        'Готов к отправке': order.ready_for_shipment ? 'Да' : 'Нет',
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
    // Показываем только opt_id без имен для минимальной ширины столбцов
    const buyerOptId = order.buyer?.opt_id || 'N/A';
    const sellerOptId = order.seller?.opt_id || 'N/A';
    return {
      buyerInfo: buyerOptId,
      sellerInfo: sellerOptId
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
    const current = sortConfig;
    const newDirection = 
      current.field === field
        ? current.direction === 'asc'
          ? 'desc'
          : current.direction === 'desc'
            ? null
            : 'asc'
        : 'asc';
    
    handleSortChange(field, newDirection);
  };

  return (
    <AdminLayout>
      <div className="w-full px-2 py-4 mx-auto max-w-[99%]">
        <Card>
          <CardHeader className="py-4 flex flex-row justify-between items-center">
            <CardTitle>Управление логистикой</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['logistics-orders'] })}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
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
            <LogisticsFilters
              pendingFilters={pendingFilters}
              appliedFilters={appliedFilters}
              onPendingFiltersChange={setPendingFilters}
              onApplyFilters={handleApplyFilters}
              onApplySearch={handleApplySearch}
              onClearSearch={handleClearSearch}
              onRemoveFilter={handleRemoveFilter}
              onClearFilters={handleClearFilters}
              sellers={uniqueSellers || []}
              buyers={uniqueBuyers || []}
              containers={containerOptions}
              stats={stats || {
                totalOrders: 0,
                filteredOrders: 0,
                notShipped: 0,
                partiallyShipped: 0,
                inTransit: 0,
                totalDeliveryPrice: 0
              }}
              hasUnappliedChanges={hasUnappliedChanges}
              hasUnappliedSearch={hasUnappliedSearch}
            />
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
                    <Button
                      variant="ghost"
                      onClick={resetWidths}
                      size="sm"
                      title="Сбросить ширину столбцов к значениям по умолчанию"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Сбросить ширину
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
            {orders.length > 50 ? (
              <VirtualizedLogisticsTable
                orders={orders}
                selectedOrders={selectedOrders}
                onSelectOrder={handleSelectOrder}
                onViewDetails={handleViewDetails}
                onManagePlaces={setManagingPlacesOrderId}
                editingContainer={editingContainer}
                tempContainerNumber={tempContainerNumber}
                onEditContainer={(orderId, containerNumber) => {
                  setEditingContainer(orderId);
                  setTempContainerNumber(containerNumber);
                }}
                onSaveContainer={initiateContainerNumberChange}
                onTempContainerChange={(value) => setTempContainerNumber(value === 'none' ? '' : value)}
                containers={containers}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                shipmentSummaries={shipmentSummaries}
                onUpdateShipmentStatus={handleUpdateShipmentStatus}
                onToggleReadyForShipment={handleToggleReadyForShipment}
                getCompactOrderInfo={getCompactOrderInfo}
                columnWidths={columnWidths}
                onResizeColumn={handleResize}
              />
            ) : (
              <div className="rounded-md border overflow-x-auto -mx-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <ResizableTableHead 
                        columnId="checkbox"
                        width={columnWidths.checkbox}
                        minWidth={40}
                        onResize={handleResize}
                      >
                        <Checkbox 
                          checked={orders?.length > 0 && orders.length === selectedOrders.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="actions"
                        width={columnWidths.actions}
                        minWidth={80}
                        onResize={handleResize}
                      >
                        Действия
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="orderNumber"
                        width={columnWidths.orderNumber}
                        minWidth={80}
                        onResize={handleResize}
                        sortable
                        sorted={sortConfig.field === 'order_number' ? sortConfig.direction : null}
                        onSort={() => handleSort('order_number')}
                      >
                        № заказа
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="seller"
                        width={columnWidths.seller}
                        minWidth={10}
                        onResize={handleResize}
                        sortable
                        sorted={sortConfig.field === 'seller_opt_id' ? sortConfig.direction : null}
                        onSort={() => handleSort('seller_opt_id')}
                      >
                        Прод.
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="buyer"
                        width={columnWidths.buyer}
                        minWidth={10}
                        onResize={handleResize}
                        sortable
                        sorted={sortConfig.field === 'buyer_opt_id' ? sortConfig.direction : null}
                        onSort={() => handleSort('buyer_opt_id')}
                      >
                        Пок.
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="title"
                        width={columnWidths.title}
                        minWidth={115}
                        onResize={handleResize}
                        sortable
                        sorted={sortConfig.field === 'title' ? sortConfig.direction : null}
                        onSort={() => handleSort('title')}
                      >
                        Наименование
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="price"
                        width={columnWidths.price}
                        minWidth={80}
                        onResize={handleResize}
                        sortable
                        sorted={sortConfig.field === 'price' ? sortConfig.direction : null}
                        onSort={() => handleSort('price')}
                      >
                        Цена ($)
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="placeNumber"
                        width={columnWidths.placeNumber}
                        minWidth={10}
                        onResize={handleResize}
                        sortable
                        sorted={sortConfig.field === 'place_number' ? sortConfig.direction : null}
                        onSort={() => handleSort('place_number')}
                      >
                        М
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="deliveryPrice"
                        width={columnWidths.deliveryPrice}
                        minWidth={80}
                        onResize={handleResize}
                        sortable
                        sorted={sortConfig.field === 'delivery_price_confirm' ? sortConfig.direction : null}
                        onSort={() => handleSort('delivery_price_confirm')}
                      >
                        Доставка
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="orderStatus"
                        width={columnWidths.orderStatus}
                        minWidth={55}
                        onResize={handleResize}
                      >
                        Статус заказа
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="readyForShipment"
                        width={columnWidths.readyForShipment}
                        minWidth={50}
                        onResize={handleResize}
                      >
                        Готов
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="containerNumber"
                        width={columnWidths.containerNumber}
                        minWidth={10}
                        onResize={handleResize}
                      >
                        Конт.
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="containerStatus"
                        width={columnWidths.containerStatus}
                        minWidth={28}
                        onResize={handleResize}
                      >
                        Ст.конт.
                      </ResizableTableHead>
                      <ResizableTableHead 
                        columnId="shipmentStatus"
                        width={columnWidths.shipmentStatus}
                        minWidth={10}
                        onResize={handleResize}
                      >
                        Ст.отгр.
                      </ResizableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const { buyerInfo, sellerInfo } = getCompactOrderInfo(order);
                      return (
                        <TableRow key={order.id} className="text-sm">
                          <TableCell style={{ width: columnWidths.checkbox, minWidth: columnWidths.checkbox }}>
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={() => handleSelectOrder(order.id)}
                            />
                          </TableCell>
                          <TableCell style={{ width: columnWidths.actions, minWidth: columnWidths.actions }}>
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
                          <TableCell className="font-medium" style={{ width: columnWidths.orderNumber, minWidth: columnWidths.orderNumber }}>
                            {order.order_number}
                          </TableCell>
                          <TableCell style={{ width: columnWidths.seller, minWidth: columnWidths.seller }}>
                            {sellerInfo}
                          </TableCell>
                          <TableCell style={{ width: columnWidths.buyer, minWidth: columnWidths.buyer }}>
                            {buyerInfo}
                          </TableCell>
                          <TableCell className="truncate" title={order.title} style={{ width: columnWidths.title, minWidth: columnWidths.title, maxWidth: columnWidths.title }}>
                            {order.title || 'Нет названия'}
                          </TableCell>
                          <TableCell style={{ width: columnWidths.price, minWidth: columnWidths.price }}>
                            {order.price ? 
                              `$${Number(order.price) % 1 === 0 ? Math.floor(Number(order.price)) : Number(order.price)}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell style={{ width: columnWidths.placeNumber, minWidth: columnWidths.placeNumber }}>
                            {order.place_number}
                          </TableCell>
                          <TableCell style={{ width: columnWidths.deliveryPrice, minWidth: columnWidths.deliveryPrice }}>
                            {order.delivery_price_confirm ? 
                              `$${order.delivery_price_confirm}` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell style={{ width: columnWidths.orderStatus, minWidth: columnWidths.orderStatus }}>
                            <OrderStatusBadge status={order.status as any} />
                          </TableCell>
                          <TableCell style={{ width: columnWidths.readyForShipment, minWidth: columnWidths.readyForShipment }}>
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={order.ready_for_shipment || false}
                                onCheckedChange={() => handleToggleReadyForShipment(order.id, order.ready_for_shipment || false)}
                              />
                            </div>
                          </TableCell>
                          <TableCell style={{ width: columnWidths.containerNumber, minWidth: columnWidths.containerNumber }}>
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
                                 <ContainerEditableWrapper
                                   orderId={order.id}
                                   fallbackContainerNumber={order.container_number}
                                   shipmentStatus={order.shipment_status}
                                   summary={shipmentSummaries?.get(order.id)}
                                   onEdit={() => {
                                     setEditingContainer(order.id);
                                     setTempContainerNumber(order.container_number || '');
                                   }}
                                 />
                              )}
                           </TableCell>
                            <TableCell style={{ width: columnWidths.containerStatus, minWidth: columnWidths.containerStatus }}>
                              <div className={`text-sm ${getStatusColor(order.containers?.[0]?.status as ContainerStatus)}`}>
                                {getStatusLabel(order.containers?.[0]?.status as ContainerStatus)}
                                {order.containers && order.containers.length > 1 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    +{order.containers.length - 1}
                                  </span>
                                )}
                             </div>
                           </TableCell>
                           <TableCell style={{ width: columnWidths.shipmentStatus, minWidth: columnWidths.shipmentStatus }}>
                             <SmartShipmentStatus
                               orderId={order.id}
                               fallbackStatus={(order.shipment_status as ShipmentStatus) || 'not_shipped'}
                               placeNumber={order.place_number || 1}
                               onStatusChange={(status) => handleUpdateShipmentStatus(order.id, status)}
                             />
                           </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="py-8 flex items-center justify-center flex-col gap-4">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    Загрузка... ({orders.length}/{totalCount})
                  </span>
                </div>
              ) : hasNextPage ? (
                <>
                  <div className="text-sm text-muted-foreground mb-2">
                    Показано {orders.length} из {totalCount} заказов
                  </div>
                  <Button 
                    onClick={() => fetchNextPage()}
                    variant="secondary"
                    className="px-6 py-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Загрузить еще
                  </Button>
                </>
              ) : orders.length > 0 ? (
                <div className="text-sm text-green-600 font-medium">
                  ✅ Все {totalCount} заказов загружены
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
