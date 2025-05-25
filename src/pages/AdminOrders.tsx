import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AdminOrderEditDialog } from '@/components/admin/AdminOrderEditDialog';
import { AdminOrderDeleteDialog } from '@/components/admin/AdminOrderDeleteDialog';
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderSearchFilters from '@/components/admin/filters/OrderSearchFilters';
import { ResponsiveOrdersView } from "@/components/admin/order/ResponsiveOrdersView";
import { OrdersPagination } from "@/components/admin/order/OrdersPagination";
import { BulkActionsBar } from "@/components/admin/order/BulkActionsBar";
import { MobileBulkActionsBar } from "@/components/admin/order/MobileBulkActionsBar";
import { SortingControls, SortField, SortDirection } from "@/components/admin/order/SortingControls";
import { BulkDeleteConfirmation, BulkStatusChangeConfirmation, SingleOrderDeleteConfirmation } from "@/components/admin/order/ConfirmationDialogs";
import { BulkActionLoading, OrderCardSkeleton } from "@/components/admin/order/LoadingStates";
import { useOptimizedOrdersQuery, Order } from "@/hooks/useOptimizedOrdersQuery";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { useLocalStorageSettings } from "@/hooks/useLocalStorageSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

const AdminOrders = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Loading states
  const [bulkActionLoading, setBulkActionLoading] = useState<{
    isLoading: boolean;
    action: string;
  }>({ isLoading: false, action: '' });
  const [singleDeleteLoading, setSingleDeleteLoading] = useState(false);

  // Confirmation dialogs
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmBulkStatus, setConfirmBulkStatus] = useState<{
    open: boolean;
    status: string;
  }>({ open: false, status: '' });
  const [confirmSingleDelete, setConfirmSingleDelete] = useState(false);

  // Settings from localStorage
  const { settings, updateSettings } = useLocalStorageSettings('admin-orders-settings');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(settings.statusFilter as StatusFilterType);
  const [sortField, setSortField] = useState<SortField>(settings.sortField as SortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(settings.sortDirection as SortDirection);
  const pageSize = settings.pageSize;

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);

  const { data, isLoading, refetch } = useOptimizedOrdersQuery({
    statusFilter,
    searchTerm: debouncedSearchTerm,
    page: currentPage,
    pageSize,
    sortField,
    sortDirection
  });

  const orders = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const hasNextPage = data?.hasNextPage || false;
  const hasPreviousPage = data?.hasPreviousPage || false;

  // Memoized selected orders data
  const selectedOrdersData = useMemo(() => 
    orders.filter(order => selectedOrders.includes(order.id)),
    [orders, selectedOrders]
  );

  const totalSelectedValue = useMemo(() =>
    selectedOrdersData.reduce((sum, order) => sum + (order.price || 0), 0),
    [selectedOrdersData]
  );

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleStatusFilterChange = useCallback((value: StatusFilterType) => {
    setStatusFilter(value);
    setCurrentPage(1);
    updateSettings({ statusFilter: value });
  }, [updateSettings]);

  const handleSortChange = useCallback((field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
    updateSettings({ sortField: field, sortDirection: direction });
  }, [updateSettings]);

  const handleViewDetails = useCallback((orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  }, [navigate]);

  const handleEdit = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowEditDialog(true);
  }, []);

  const handleDelete = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  }, []);

  // Bulk actions
  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedOrders(orders.map(order => order.id));
  }, [orders]);

  const handleClearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const handleBulkStatusChange = useCallback(async (newStatus: string) => {
    if (selectedOrders.length === 0) return;

    setBulkActionLoading({ isLoading: true, action: 'изменение статуса' });
    try {
      const promises = selectedOrders.map(orderId =>
        supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId)
      );

      await Promise.all(promises);
      
      refetch();
      setSelectedOrders([]);
      toast({
        title: "Статусы обновлены",
        description: `Обновлено ${selectedOrders.length} заказов`,
      });
    } catch (error) {
      console.error("Failed to update orders:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статусы заказов",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading({ isLoading: false, action: '' });
    }
  }, [selectedOrders, refetch]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedOrders.length === 0) return;

    setBulkActionLoading({ isLoading: true, action: 'удаление заказов' });
    try {
      const promises = selectedOrders.map(orderId =>
        supabase
          .from('orders')
          .delete()
          .eq('id', orderId)
      );

      await Promise.all(promises);
      
      refetch();
      setSelectedOrders([]);
      toast({
        title: "Заказы удалены",
        description: `Удалено ${selectedOrders.length} заказов`,
      });
    } catch (error) {
      console.error("Failed to delete orders:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказы",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading({ isLoading: false, action: '' });
    }
  }, [selectedOrders, refetch]);

  const handleSingleOrderDelete = useCallback(async () => {
    if (!selectedOrder) return;

    setSingleDeleteLoading(true);
    try {
      await supabase
        .from('orders')
        .delete()
        .eq('id', selectedOrder.id);
      
      refetch();
      setShowDeleteDialog(false);
      setSelectedOrder(null);
      toast({
        title: "Заказ удален",
        description: `Заказ №${selectedOrder.order_number} удален`,
      });
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ",
        variant: "destructive",
      });
    } finally {
      setSingleDeleteLoading(false);
    }
  }, [selectedOrder, refetch]);

  const handleQuickAction = useCallback(async (orderId: string, action: string) => {
    if (action === 'confirm') {
      try {
        await supabase
          .from('orders')
          .update({ status: 'admin_confirmed' })
          .eq('id', orderId);
        
        refetch();
        toast({
          title: "Заказ подтвержден",
          description: "Статус заказа обновлен",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось подтвердить заказ",
          variant: "destructive",
        });
      }
    }
  }, [refetch]);

  const handleExport = useCallback(() => {
    if (selectedOrdersData.length === 0) {
      toast({
        title: "Нет данных для экспорта",
        description: "Выберите заказы для экспорта",
        variant: "destructive",
      });
      return;
    }

    const exportData = selectedOrdersData.map(order => ({
      'Номер заказа': order.order_number,
      'Дата создания': new Date(order.created_at).toLocaleDateString('ru-RU'),
      'Название': order.title,
      'Бренд': order.brand || '',
      'Модель': order.model || '',
      'Цена товара': order.price || 0,
      'Цена доставки': order.delivery_price_confirm || 0,
      'Количество мест': order.place_number,
      'Статус': order.status,
      'Продавец': order.seller?.full_name || 'Не указан',
      'ID продавца': order.seller?.opt_id || '',
      'Покупатель': order.buyer?.full_name || 'Не указан',
      'ID покупателя': order.buyer?.opt_id || '',
      'Telegram продавца': order.seller?.telegram || '',
      'Telegram покупателя': order.buyer?.telegram || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Заказы");
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `orders_export_${date}.xlsx`);

    toast({
      title: "Экспорт завершен",
      description: `Экспортировано ${selectedOrdersData.length} заказов`,
    });
  }, [selectedOrdersData]);

  const handleOrderStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    if (!selectedOrder) return;
    
    try {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select('*, seller:profiles!orders_seller_id_fkey(*)')
        .single();
        
      if (error) throw error;
      
      try {
        const { data: orderImages } = await supabase
          .from('order_images')
          .select('url')
          .eq('order_id', orderId);
          
        const images = orderImages?.map(img => img.url) || [];
        
        await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...updatedOrder, images },
            action: 'status_change'
          }
        });
      } catch (notifyError) {
        console.error('Failed to send status update notification:', notifyError);
      }
      
      setShowEditDialog(false);
      refetch();
      toast({
        title: "Статус обновлен",
        description: `Статус заказа №${selectedOrder.order_number} обновлен`,
      });
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive",
      });
    }
  }, [selectedOrder, refetch]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Управление заказами</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col space-y-4 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Управление заказами
              </CardTitle>
              {!isMobile && (
                <div className="flex items-center gap-4">
                  <SortingControls
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                  />
                  <Select
                    value={statusFilter}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger className="w-[200px] border-2 transition-colors hover:border-primary/50">
                      <SelectValue placeholder="Фильтр по статусу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="created">Создан</SelectItem>
                      <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
                      <SelectItem value="admin_confirmed">Подтвержден администратором</SelectItem>
                      <SelectItem value="processed">Зарегистрирован</SelectItem>
                      <SelectItem value="shipped">Отправлен</SelectItem>
                      <SelectItem value="delivered">Доставлен</SelectItem>
                      <SelectItem value="cancelled">Отменен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <OrderSearchFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeSearchTerm={debouncedSearchTerm}
              onSearch={handleSearch}
              onClearSearch={clearSearch}
            />
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Desktop Bulk Actions */}
            {!isMobile && (
              <BulkActionsBar
                selectedOrders={selectedOrders}
                allOrders={orders}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onBulkStatusChange={(status) => {
                  setConfirmBulkStatus({ open: true, status });
                }}
                onBulkDelete={() => setConfirmBulkDelete(true)}
                onExport={handleExport}
              />
            )}

            <ResponsiveOrdersView
              orders={orders}
              selectedOrders={selectedOrders}
              onSelectOrder={handleSelectOrder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
              onQuickAction={handleQuickAction}
            />
            
            <OrdersPagination
              currentPage={currentPage}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
            />
          </CardContent>
        </Card>

        {/* Mobile Bulk Actions */}
        {isMobile && (
          <MobileBulkActionsBar
            selectedOrders={selectedOrders}
            allOrders={orders}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBulkStatusChange={(status) => {
              setConfirmBulkStatus({ open: true, status });
            }}
            onBulkDelete={() => setConfirmBulkDelete(true)}
            onExport={handleExport}
          />
        )}

        {/* Loading Overlay */}
        <BulkActionLoading
          isLoading={bulkActionLoading.isLoading}
          selectedCount={selectedOrders.length}
          action={bulkActionLoading.action}
        />

        {/* Confirmation Dialogs */}
        <BulkDeleteConfirmation
          open={confirmBulkDelete}
          onOpenChange={setConfirmBulkDelete}
          selectedCount={selectedOrders.length}
          totalValue={totalSelectedValue}
          onConfirm={() => {
            setConfirmBulkDelete(false);
            handleBulkDelete();
          }}
          isLoading={bulkActionLoading.isLoading}
        />

        <BulkStatusChangeConfirmation
          open={confirmBulkStatus.open}
          onOpenChange={(open) => setConfirmBulkStatus({ open, status: '' })}
          selectedCount={selectedOrders.length}
          newStatus={confirmBulkStatus.status}
          onConfirm={() => {
            setConfirmBulkStatus({ open: false, status: '' });
            handleBulkStatusChange(confirmBulkStatus.status);
          }}
          isLoading={bulkActionLoading.isLoading}
        />

        <SingleOrderDeleteConfirmation
          open={confirmSingleDelete}
          onOpenChange={setConfirmSingleDelete}
          order={selectedOrder}
          onConfirm={() => {
            setConfirmSingleDelete(false);
            handleSingleOrderDelete();
          }}
          isLoading={singleDeleteLoading}
        />

        {/* Existing Dialogs */}
        <AdminOrderEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          order={selectedOrder}
          onStatusChange={handleOrderStatusChange}
        />

        <AdminOrderDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          order={selectedOrder}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
