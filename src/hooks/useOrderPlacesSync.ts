import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Individual shipments can only be 'not_shipped' or 'in_transit'
// The 'partially_shipped' status is calculated at the order level
export type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';
export type IndividualShipmentStatus = 'not_shipped' | 'in_transit';

export const useOrderPlacesSync = () => {
  const { toast } = useToast();

  // Function to ensure order_shipments exist for an order
  const ensureOrderShipments = useCallback(async (orderId: string) => {
    try {
      // Get order details including place_number
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('place_number')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Check existing shipments
      const { data: existingShipments, error: shipmentError } = await supabase
        .from('order_shipments')
        .select('place_number')
        .eq('order_id', orderId);

      if (shipmentError) throw shipmentError;

      const existingPlaces = new Set(existingShipments?.map(s => s.place_number) || []);
      const shipmentsToCreate = [];

      // Create missing shipments
      for (let i = 1; i <= order.place_number; i++) {
        if (!existingPlaces.has(i)) {
          shipmentsToCreate.push({
            order_id: orderId,
            place_number: i,
            shipment_status: 'not_shipped' as IndividualShipmentStatus,
            container_number: null,
            description: null
          });
        }
      }

      // Remove extra shipments if place_number decreased
      if (existingShipments && existingShipments.length > order.place_number) {
        const placesToRemove = existingShipments
          .filter(s => s.place_number > order.place_number)
          .map(s => s.place_number);

        const { error: deleteError } = await supabase
          .from('order_shipments')
          .delete()
          .eq('order_id', orderId)
          .in('place_number', placesToRemove);

        if (deleteError) throw deleteError;
      }

      // Insert new shipments if any
      if (shipmentsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('order_shipments')
          .insert(shipmentsToCreate);

        if (insertError) throw insertError;
      }

    } catch (error) {
      console.error('Error ensuring order shipments:', error);
      throw error;
    }
  }, []);

  // Function to sync shipments with order-level changes
  const syncShipmentsWithOrder = useCallback(async (
    orderId: string,
    newStatus?: ShipmentStatus,
    newContainerNumber?: string | null
  ) => {
    try {
      // Get order details to check place_number
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('place_number')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Prevent setting partially_shipped for single-place orders
      if (newStatus === 'partially_shipped' && order.place_number === 1) {
        throw new Error('Cannot set partially shipped status for orders with only one place');
      }

      // First, ensure all shipments exist
      await ensureOrderShipments(orderId);

    // If the newStatus is 'partially_shipped', it only updates the order status
    // Individual shipments can only be 'not_shipped' or 'in_transit'
    if (newStatus === 'partially_shipped') {
      // Only update the order status, don't touch individual shipments
      const { error: orderError } = await supabase
        .from('orders')
        .update({ shipment_status: newStatus })
        .eq('id', orderId);

      if (orderError) throw orderError;
      return;
    }

      // For other statuses, sync all places
      const updates: any = {};
      if (newStatus) updates.shipment_status = newStatus;
      if (newContainerNumber !== undefined) updates.container_number = newContainerNumber;

      if (Object.keys(updates).length > 0) {
        // Update all shipments for this order
        const { error: shipmentError } = await supabase
          .from('order_shipments')
          .update(updates)
          .eq('order_id', orderId);

        if (shipmentError) throw shipmentError;

        // Update the order as well
        const orderUpdates: any = {};
        if (newStatus) orderUpdates.shipment_status = newStatus;
        if (newContainerNumber !== undefined) orderUpdates.container_number = newContainerNumber;

        const { error: orderError } = await supabase
          .from('orders')
          .update(orderUpdates)
          .eq('id', orderId);

        if (orderError) throw orderError;
      }

    } catch (error) {
      console.error('Error syncing shipments with order:', error);
      throw error;
    }
  }, [ensureOrderShipments]);

  // Function to calculate order status from shipments
  const calculateOrderStatusFromShipments = useCallback(async (orderId: string): Promise<ShipmentStatus> => {
    try {
      const { data: shipments, error } = await supabase
        .from('order_shipments')
        .select('shipment_status')
        .eq('order_id', orderId);

      if (error) throw error;

      if (!shipments || shipments.length === 0) {
        return 'not_shipped';
      }

      const shippedCount = shipments.filter(s => s.shipment_status === 'in_transit').length;
      const totalCount = shipments.length;

      if (shippedCount === 0) {
        return 'not_shipped';
      } else if (shippedCount === totalCount) {
        return 'in_transit';
      } else {
        return 'partially_shipped';
      }
    } catch (error) {
      console.error('Error calculating order status:', error);
      return 'not_shipped';
    }
  }, []);

  return {
    ensureOrderShipments,
    syncShipmentsWithOrder,
    calculateOrderStatusFromShipments
  };
};