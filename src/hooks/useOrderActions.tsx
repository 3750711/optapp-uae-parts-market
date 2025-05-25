
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

export const useOrderActions = (orders: Order[], selectedOrders: string[], refetch: () => void) => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  // Memoized selected orders data
  const selectedOrdersData = useMemo(() => 
    orders.filter(order => selectedOrders.includes(order.id)),
    [orders, selectedOrders]
  );

  const totalSelectedValue = useMemo(() =>
    selectedOrdersData.reduce((sum, order) => sum + (order.price || 0), 0),
    [selectedOrdersData]
  );

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

  return {
    selectedOrder,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    bulkActionLoading,
    singleDeleteLoading,
    confirmBulkDelete,
    setConfirmBulkDelete,
    confirmBulkStatus,
    setConfirmBulkStatus,
    confirmSingleDelete,
    setConfirmSingleDelete,
    selectedOrdersData,
    totalSelectedValue,
    handleViewDetails,
    handleEdit,
    handleDelete,
    handleBulkStatusChange,
    handleBulkDelete,
    handleSingleOrderDelete,
    handleQuickAction,
    handleExport,
    handleOrderStatusChange,
  };
};
