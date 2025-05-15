
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOrderCard } from "@/components/admin/AdminOrderCard";
import { Loader2, Eye } from "lucide-react";
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

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, activeSearchTerm],
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
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply search filter if there's an active search term
      if (activeSearchTerm) {
        query = query.or(
          `order_number.ilike.%${activeSearchTerm}%,` +
          `title.ilike.%${activeSearchTerm}%,` +
          `brand.ilike.%${activeSearchTerm}%,` +
          `model.ilike.%${activeSearchTerm}%,` +
          `buyer_opt_id.ilike.%${activeSearchTerm}%,` +
          `seller_opt_id.ilike.%${activeSearchTerm}%,` +
          `text_order.ilike.%${activeSearchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить заказы",
          variant: "destructive",
        });
        throw error;
      }

      return data;
    }
  });

  // Use the pagination hook
  const { paginatedData: paginatedOrders, totalPages } = usePaginatedData(
    orders || [],
    { pageSize, currentPage }
  );

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm.trim());
    setCurrentPage(1); // Reset to first page on new search
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1); // Reset to first page when clearing search
  };

  const handleViewDetails = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleEdit = (order: any) => {
    setSelectedOrder(order);
    setShowEditDialog(true);
  };

  const handleDelete = (order: any) => {
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
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Управление заказами</CardTitle>
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilterType) => {
                  setStatusFilter(value);
                  setCurrentPage(1); // Reset to first page on filter change
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
            
            <OrderSearchFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeSearchTerm={activeSearchTerm}
              onSearch={handleSearch}
              onClearSearch={clearSearch}
            />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedOrders?.length ? (
                paginatedOrders.map((order) => (
                  <div key={order.id} className="relative group">
                    <AdminOrderCard
                      order={order}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={() => handleViewDetails(order.id)}
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
            
            {/* Load More Button */}
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
