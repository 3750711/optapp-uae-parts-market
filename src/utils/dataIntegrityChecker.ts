import { supabase } from '@/integrations/supabase/client';

export interface DataIntegrityIssue {
  orderId: string;
  orderTitle: string;
  shipmentId: string;
  placeNumber: number;
  issue: 'in_transit_without_container' | 'container_without_in_transit';
  description: string;
}

export const checkDataIntegrity = async (): Promise<DataIntegrityIssue[]> => {
  try {
    // Find shipments with in_transit status but no container
    const { data: inconsistentShipments, error } = await supabase
      .from('order_shipments')
      .select(`
        id,
        order_id,
        place_number,
        shipment_status,
        container_number,
        orders!inner(title)
      `)
      .eq('shipment_status', 'in_transit')
      .is('container_number', null);

    if (error) throw error;

    const issues: DataIntegrityIssue[] = [];

    inconsistentShipments?.forEach(shipment => {
      issues.push({
        orderId: shipment.order_id,
        orderTitle: (shipment.orders as any).title,
        shipmentId: shipment.id,
        placeNumber: shipment.place_number,
        issue: 'in_transit_without_container',
        description: `Место ${shipment.place_number} отмечено как отправленное, но не указан контейнер`
      });
    });

    return issues;
  } catch (error) {
    console.error('Error checking data integrity:', error);
    return [];
  }
};

export const fixDataIntegrityIssues = async (issues: DataIntegrityIssue[]): Promise<void> => {
  try {
    for (const issue of issues) {
      if (issue.issue === 'in_transit_without_container') {
        // Fix by setting status back to not_shipped
        await supabase
          .from('order_shipments')
          .update({ shipment_status: 'not_shipped' })
          .eq('id', issue.shipmentId);
      }
    }
  } catch (error) {
    console.error('Error fixing data integrity issues:', error);
    throw error;
  }
};