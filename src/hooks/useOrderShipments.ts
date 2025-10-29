import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderShipment {
  id: string;
  order_id: string;
  place_number: number;
  container_number: string | null;
  shipment_status: 'not_shipped' | 'in_transit';
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useOrderShipments = (orderId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: shipments = [], isLoading, error } = useQuery({
    queryKey: ['order-shipments', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_shipments')
        .select('*')
        .eq('order_id', orderId)
        .order('place_number');

      if (error) throw error;
      return data as OrderShipment[];
    },
    enabled: !!orderId,
  });

  const updateShipment = useCallback(async (
    shipmentId: string,
    updates: Partial<Omit<OrderShipment, 'id' | 'order_id' | 'created_at' | 'updated_at'>>
  ) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('order_shipments')
        .update(updates)
        .eq('id', shipmentId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['order-shipments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      
      toast({
        title: "Успешно",
        description: "Информация о месте обновлена",
      });
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить информацию о месте",
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [orderId, queryClient, toast]);

  // Function to sync order shipment status based on individual shipments
  const syncOrderStatus = useCallback(async () => {
    try {
      // Get all shipments for this order
      const { data: allShipments, error: shipmentsError } = await supabase
        .from('order_shipments')
        .select('shipment_status, container_number')
        .eq('order_id', orderId);

      if (shipmentsError) throw shipmentsError;

      if (!allShipments || allShipments.length === 0) return;

      // Data integrity check: fix shipments with in_transit status but no container
      const inconsistentShipments = allShipments.filter(s => 
        s.shipment_status === 'in_transit' && !s.container_number
      );

      if (inconsistentShipments.length > 0) {
        console.warn(`Found ${inconsistentShipments.length} shipments with in_transit status but no container. This indicates data inconsistency.`);
        // Could optionally auto-fix by setting status to not_shipped:
        // await supabase
        //   .from('order_shipments')
        //   .update({ shipment_status: 'not_shipped' })
        //   .in('id', inconsistentShipments.map(s => s.id));
      }

      // Calculate the correct order status
      const shippedCount = allShipments.filter(s => s.shipment_status === 'in_transit').length;
      const totalCount = allShipments.length;

      let newOrderStatus: 'not_shipped' | 'partially_shipped' | 'in_transit';
      if (shippedCount === 0) {
        newOrderStatus = 'not_shipped';
      } else if (shippedCount === totalCount) {
        newOrderStatus = 'in_transit';
      } else {
        newOrderStatus = 'partially_shipped';
      }

      // Update the order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ shipment_status: newOrderStatus })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Invalidate logistics orders to refresh the display
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-shipment-summary', orderId] });

    } catch (error) {
      console.error('Error syncing order status:', error);
    }
  }, [orderId, queryClient]);

  const updateMultipleShipments = useCallback(async (
    updates: Array<{ id: string; updates: Partial<Omit<OrderShipment, 'id' | 'order_id' | 'created_at' | 'updated_at'>> }>
  ) => {
    setIsUpdating(true);
    try {
      // Fix #1: Optimistic locking - check updated_at before updating
      for (const { id, updates: shipmentUpdates } of updates) {
        const currentShipment = shipments.find(s => s.id === id);
        if (!currentShipment) {
          throw new Error('Shipment not found. Please refresh the page.');
        }

        // Validate shipment status
        if (shipmentUpdates.shipment_status && 
            !['not_shipped', 'in_transit'].includes(shipmentUpdates.shipment_status)) {
          throw new Error(`Invalid shipment status for individual place: ${shipmentUpdates.shipment_status}`);
        }
        
        // Check if the shipment was modified by another user
        const { data: freshShipment, error: checkError } = await supabase
          .from('order_shipments')
          .select('updated_at')
          .eq('id', id)
          .single();

        if (checkError) throw checkError;

        if (freshShipment.updated_at !== currentShipment.updated_at) {
          throw new Error(
            'Запись была изменена другим пользователем. Пожалуйста, обновите страницу и попробуйте снова.'
          );
        }
      }

      // Fix #4: Use RPC function for atomic batch updates with transaction
      const shipmentUpdatesForRpc = updates.map(({ id, updates: shipmentUpdates }) => ({
        id,
        ...shipmentUpdates
      }));

      const { error } = await supabase.rpc('update_multiple_shipments', {
        shipment_updates: shipmentUpdatesForRpc as any
      });

      if (error) throw error;

      // Sync the order status after updating shipments
      await syncOrderStatus();

      queryClient.invalidateQueries({ queryKey: ['order-shipments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['logistics-orders'] });
      
      toast({
        title: "Успешно",
        description: `Обновлено ${updates.length} мест`,
      });
    } catch (error: any) {
      console.error('Error updating multiple shipments:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось обновить информацию о местах",
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [orderId, queryClient, toast, syncOrderStatus, shipments]);

  return {
    shipments,
    isLoading,
    error,
    isUpdating,
    updateShipment,
    updateMultipleShipments,
    syncOrderStatus,
  };
};