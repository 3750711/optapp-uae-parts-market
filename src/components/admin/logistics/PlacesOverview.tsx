import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Container, CheckCircle2, Clock } from 'lucide-react';
import { OrderShipment } from '@/hooks/useOrderShipments';

interface PlacesOverviewProps {
  shipments: OrderShipment[];
  editedShipments: Record<string, Partial<OrderShipment>>;
}

export const PlacesOverview: React.FC<PlacesOverviewProps> = ({ 
  shipments, 
  editedShipments 
}) => {
  const getEditedValue = (shipmentId: string, field: keyof OrderShipment, defaultValue: any) => {
    return editedShipments[shipmentId]?.[field] ?? defaultValue;
  };

  const statusCounts = shipments.reduce((acc, shipment) => {
    const status = getEditedValue(shipment.id, 'shipment_status', shipment.shipment_status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const containersAssigned = shipments.filter(shipment => 
    getEditedValue(shipment.id, 'container_number', shipment.container_number)
  ).length;

  const hasUnsavedChanges = Object.keys(editedShipments).length > 0;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Всего мест: {shipments.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Отправлено: {statusCounts.in_transit || 0}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Не отправлено: {statusCounts.not_shipped || 0}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Container className="h-4 w-4 text-blue-600" />
              <span className="text-sm">С контейнерами: {containersAssigned}</span>
            </div>
          </div>

          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <Clock className="h-3 w-3 mr-1" />
              Есть несохраненные изменения
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};