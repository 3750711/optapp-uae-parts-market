
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const useOrderCacheManager = () => {
  const queryClient = useQueryClient();

  const invalidateAllOrderCaches = useCallback(() => {
    console.log("🗑️ Invalidating all order caches");
    
    // Инвалидируем все кэши заказов
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
    queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
    
    // Инвалидируем связанные метрики и статистики
    queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'metrics-optimized'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    
    // Принудительно обновляем данные
    queryClient.refetchQueries({ queryKey: ['admin-orders-optimized'] });
  }, [queryClient]);

  const optimisticDeleteOrder = useCallback((orderId: string) => {
    console.log("🔄 Optimistic order deletion:", orderId);
    
    // Оптимистично удаляем заказ из кэша
    queryClient.setQueryData(['admin-orders-optimized'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.filter((order: any) => order.id !== orderId),
        totalCount: Math.max(0, (oldData.totalCount || 1) - 1)
      };
    });

    // Также обновляем стандартный кэш
    queryClient.setQueryData(['admin-orders'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.filter((order: any) => order.id !== orderId)
      };
    });
  }, [queryClient]);

  const optimisticUpdateOrderStatus = useCallback((orderId: string, newStatus: string) => {
    console.log("🔄 Optimistic status update:", orderId, "->", newStatus);
    
    // Оптимистично обновляем статус заказа
    queryClient.setQueryData(['admin-orders-optimized'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.map((order: any) => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      };
    });

    queryClient.setQueryData(['admin-orders'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.map((order: any) => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      };
    });
  }, [queryClient]);

  const optimisticBulkDelete = useCallback((orderIds: string[]) => {
    console.log("🔄 Optimistic bulk deletion:", orderIds.length, "orders");
    
    // Оптимистично удаляем заказы из кэша
    queryClient.setQueryData(['admin-orders-optimized'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.filter((order: any) => !orderIds.includes(order.id)),
        totalCount: Math.max(0, (oldData.totalCount || orderIds.length) - orderIds.length)
      };
    });

    queryClient.setQueryData(['admin-orders'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.filter((order: any) => !orderIds.includes(order.id))
      };
    });
  }, [queryClient]);

  return {
    invalidateAllOrderCaches,
    optimisticDeleteOrder,
    optimisticUpdateOrderStatus,
    optimisticBulkDelete
  };
};
