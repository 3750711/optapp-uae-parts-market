import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import * as XLSX from 'xlsx';
import { FileText, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Container, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
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

  // Filters state - separate pending and applied
  const [pendingFilters, setPendingFilters] = useState<LogisticsFiltersType>({
    sellerIds: [],
    buyerIds: [],
    containerNumbers: [],
    shipmentStatuses: [],
    containerStatuses: [],
    orderStatuses: [],
    searchTerm: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<LogisticsFiltersType>({
    sellerIds: [],
    buyerIds: [],
    containerNumbers: [],
    shipmentStatuses: [],
    containerStatuses: [],
    orderStatuses: [],
    searchTerm: ''
  });

  // Check if there are unapplied changes
  const hasUnappliedChanges = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  // Function to apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    setSelectedOrders([]); // Clear selection when filters change
  };

  // Function to clear all filters
  const handleClearFilters = () => {
    const emptyFilters: LogisticsFiltersType = {
      sellerIds: [],
      buyerIds: [],
      containerNumbers: [],
      shipmentStatuses: [],
      containerStatuses: [],
      orderStatuses: [],
      searchTerm: ''
    };
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSelectedOrders([]);
  };

  // Function to remove specific filter and apply immediately
  const handleRemoveFilter = (key: keyof LogisticsFiltersType, value: string) => {
    const currentValues = appliedFilters[key] as string[];
    const newValues = currentValues.filter(v => v !== value);
    const newFilters = { ...appliedFilters, [key]: newValues };
    
    // Update both pending and applied simultaneously
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    setSelectedOrders([]);
  };

  // Debounced search - применяется автоматически
  const debouncedSearchTerm = useDebounce(pendingFilters.searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm !== appliedFilters.searchTerm) {
      setAppliedFilters(prev => ({ ...prev, searchTerm: debouncedSearchTerm }));
    }
  }, [debouncedSearchTerm, appliedFilters.searchTerm]);

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

  useEffect(() => {
    const currentRef = loadMoreRef.current; // Сохраняем ссылку
    
    if (!currentRef || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef); // Используем сохраненную ссылку
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const orders = data?.pages.flatMap(page => page.orders) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

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
                          <OrderStatusBadge status={order.status as any} />
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
                          <TableCell>
                            <div className={`text-sm ${getStatusColor(order.containers?.[0]?.status as ContainerStatus)}`}>
                              {getStatusLabel(order.containers?.[0]?.status as ContainerStatus)}
                              {order.containers && order.containers.length > 1 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  +{order.containers.length - 1}
                                </span>
                              )}
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
