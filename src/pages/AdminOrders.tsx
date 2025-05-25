import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Download } from "lucide-react";
import { AdminOrderEditDialog } from '@/components/admin/AdminOrderEditDialog';
import { AdminOrderDeleteDialog } from '@/components/admin/AdminOrderDeleteDialog';
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderSearchFilters from '@/components/admin/filters/OrderSearchFilters';
import { usePaginatedData } from "@/hooks/usePaginatedData";
import LoadMoreTrigger from "@/components/admin/productGrid/LoadMoreTrigger";
import { AdminSEO } from "@/components/admin/AdminSEO";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { BulkOrderActions } from "@/components/admin/BulkOrderActions";
import { OrderSortingControls } from "@/components/admin/OrderSortingControls";
import { OptimizedAdminOrderCard } from "@/components/admin/OptimizedAdminOrderCard";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

// Определяем тип для заказа, чтобы избежать ошибок TypeScript
type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
    opt_status: string | null;
  } | null;
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const pageSize = 20;

  // Load saved filters from localStorage
  React.useEffect(() => {
    const savedFilters = localStorage.getItem('admin-orders-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setStatusFilter(parsed.statusFilter || 'all');
        setSortField(parsed.sortField || 'created_at');
        setSortOrder(parsed.sortOrder || 'desc');
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage
  React.useEffect(() => {
    const filters = { statusFilter, sortField, sortOrder };
    localStorage.setItem('admin-orders-filters', JSON.stringify(filters));
  }, [statusFilter, sortField, sortOrder]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, activeSearchTerm, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone
          ),
          seller:profiles!orders_seller_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone,
            opt_status
          )
        `)
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (activeSearchTerm) {
        const isNumeric = !isNaN(Number(activeSearchTerm));
        
        if (isNumeric) {
          query = query.or(
            `order_number.eq.${Number(activeSearchTerm)},` +
            `title.ilike.%${activeSearchTerm}%,` +
            `brand.ilike.%${activeSearchTerm}%,` +
            `model.ilike.%${activeSearchTerm}%,` +
            `buyer_opt_id.ilike.%${activeSearchTerm}%,` +
            `seller_opt_id.ilike.%${activeSearchTerm}%,` +
            `text_order.ilike.%${activeSearchTerm}%`
          );
        } else {
          query = query.or(
            `title.ilike.%${activeSearchTerm}%,` +
            `brand.ilike.%${activeSearchTerm}%,` +
            `model.ilike.%${activeSearchTerm}%,` +
            `buyer_opt_id.ilike.%${activeSearchTerm}%,` +
            `seller_opt_id.ilike.%${activeSearchTerm}%,` +
            `text_order.ilike.%${activeSearchTerm}%`
          );
        }
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить заказы",
          variant: "destructive",
        });
        console.error("Ошибка загрузки заказов:", error);
        throw error;
      }

      return data as Order[];
    }
  });

  // Bulk actions mutations
  const bulkConfirmMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'admin_confirmed' })
        .in('id', orderIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Успешно",
        description: `${selectedIds.length} заказов подтверждено`,
      });
      setSelectedIds([]);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Успешно",
        description: `${selectedIds.length} заказов удалено`,
      });
      setSelectedIds([]);
    }
  });

  // Используем хук для пагинации
  const { paginatedData: paginatedOrders, totalPages } = usePaginatedData(
    orders || [],
    { pageSize, currentPage }
  );

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handleSearch = useCallback(() => {
    setActiveSearchTerm(searchTerm.trim());
    setCurrentPage(1);
  }, [searchTerm]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  const handleSelectionChange = useCallback((orderId: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  }, []);

  const handleBulkExport = useCallback(async (orderIds: string[]) => {
    try {
      const ordersToExport = orders?.filter(order => orderIds.includes(order.id)) || [];
      
      // Create CSV content
      const headers = ['Номер заказа', 'Статус', 'Товар', 'Цена', 'Продавец', 'Покупатель', 'Дата создания'];
      const csvContent = [
        headers.join(','),
        ...ordersToExport.map(order => [
          order.order_number,
          order.status,
          `"${order.title}"`,
          order.price,
          `"${order.seller?.full_name || 'Не указано'}"`,
          `"${order.buyer?.full_name || 'Не указано'}"`,
          new Date(order.created_at).toLocaleDateString('ru-RU')
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Успешно",
        description: "Данные экспортированы в CSV файл",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  }, [orders]);

  const handleViewDetails = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setShowEditDialog(true);
  };

  const handleDelete = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    if (!selectedOrder) return;
    
    try {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select('*, seller:profiles!orders_seller_id_fkey(*)')
        .single();
        
      if (error) throw error;
      
      // Send notification about order status change
      try {
        // Get order images
        const { data: orderImages } = await supabase
          .from('order_images')
          .select('url')
          .eq('order_id', orderId);
          
        const images = orderImages?.map(img => img.url) || [];
        
        const notificationResult = await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...updatedOrder, images },
            action: 'status_change'
          }
        });
        
        console.log("Status update notification result:", notificationResult);
      } catch (notifyError) {
        console.error('Failed to send status update notification:', notifyError);
      }
      
      setShowEditDialog(false);
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
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminSEO title="Заказы" description="Управление заказами в административной панели OptCargo" />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminSEO 
        title="Управление заказами" 
        description="Административная панель для управления заказами OptCargo"
        breadcrumbs={[
          { name: 'Главная', href: '/admin' },
          { name: 'Заказы' }
        ]}
      />
      
      <div className="container mx-auto py-8">
        <AdminBreadcrumbs />
        
        <Card>
          <CardHeader className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Управление заказами</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                >
                  Массовый выбор
                </Button>
                <Select
                  value={statusFilter}
                  onValueChange={(value: StatusFilterType) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
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
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <OrderSearchFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  activeSearchTerm={activeSearchTerm}
                  onSearch={handleSearch}
                  onClearSearch={clearSearch}
                />
              </div>
              <OrderSortingControls
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <BulkOrderActions
              selectedIds={selectedIds}
              onClearSelection={() => setSelectedIds([])}
              onBulkConfirm={(ids) => bulkConfirmMutation.mutate(ids)}
              onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
              onBulkExport={handleBulkExport}
              isLoading={bulkConfirmMutation.isPending || bulkDeleteMutation.isPending}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedOrders?.length ? (
                paginatedOrders.map((order) => (
                  <div key={order.id} className="relative group">
                    <OptimizedAdminOrderCard
                      order={order}
                      onEdit={setSelectedOrder}
                      onDelete={setSelectedOrder}
                      isSelected={selectedIds.includes(order.id)}
                      onSelectionChange={handleSelectionChange}
                      showCheckbox={showBulkActions}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      title="Посмотреть детали заказа"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-10 text-muted-foreground">
                  {activeSearchTerm ? "Нет заказов, соответствующих поисковому запросу" : "Нет заказов с выбранным статусом"}
                </div>
              )}
            </div>
            
            {orders && orders.length > 0 && currentPage < totalPages && (
              <div className="flex justify-center mt-8">
                <LoadMoreTrigger
                  hasNextPage={currentPage < totalPages}
                  isFetchingNextPage={false}
                  innerRef={React.createRef()}
                  onLoadMore={handleLoadMore}
                />
              </div>
            )}
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
