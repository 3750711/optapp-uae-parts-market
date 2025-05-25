
import React, { useState, useCallback } from "react";
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
import { VirtualizedOrdersList } from "@/components/admin/order/VirtualizedOrdersList";
import { OrdersPagination } from "@/components/admin/order/OrdersPagination";
import { useOptimizedOrdersQuery, Order } from "@/hooks/useOptimizedOrdersQuery";
import { useDebounceValue } from "@/hooks/useDebounceValue";
import { supabase } from "@/integrations/supabase/client";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);

  const { data, isLoading, refetch } = useOptimizedOrdersQuery({
    statusFilter,
    searchTerm: debouncedSearchTerm,
    page: currentPage,
    pageSize
  });

  const orders = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const hasNextPage = data?.hasNextPage || false;
  const hasPreviousPage = data?.hasPreviousPage || false;

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
  }, []);

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
      refetch(); // Refetch data instead of invalidating
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
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            
            <OrderSearchFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeSearchTerm={debouncedSearchTerm}
              onSearch={handleSearch}
              onClearSearch={clearSearch}
            />
          </CardHeader>
          <CardContent className="p-6">
            <VirtualizedOrdersList
              orders={orders}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
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
