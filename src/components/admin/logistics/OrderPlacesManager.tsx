import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Save, X } from 'lucide-react';
import { useOrderShipments, OrderShipment } from '@/hooks/useOrderShipments';
import { useContainers } from '@/hooks/useContainers';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useToast } from '@/hooks/use-toast';
import { PlacesOverview } from './PlacesOverview';
import { PlaceRow } from './PlaceRow';
import { BulkActions } from './BulkActions';

interface OrderPlacesManagerProps {
  orderId: string;
  onClose: () => void;
  readOnly?: boolean;
  orderShipmentStatus?: 'not_shipped' | 'partially_shipped' | 'in_transit';
}

export const OrderPlacesManager: React.FC<OrderPlacesManagerProps> = ({ 
  orderId, 
  onClose, 
  readOnly = false, 
  orderShipmentStatus 
}) => {
  const { shipments, isLoading, updateMultipleShipments, isUpdating } = useOrderShipments(orderId);
  const { containers, isLoading: containersLoading } = useContainers();
  const { isAdmin } = useAdminAccess();
  const { toast } = useToast();
  const [editedShipments, setEditedShipments] = useState<Record<string, Partial<OrderShipment>>>({});

  // Admins can edit all fields, others only when status is partially_shipped
  const isFieldsDisabled = !isAdmin && (orderShipmentStatus !== 'partially_shipped');
  const hasUnsavedChanges = Object.keys(editedShipments).length > 0;

  const handleFieldChange = (shipmentId: string, field: keyof OrderShipment, value: any) => {
    setEditedShipments(prev => {
      const newState = {
        ...prev,
        [shipmentId]: {
          ...prev[shipmentId],
          [field]: value
        }
      };

      // Auto-clear container when status changes to not_shipped
      if (field === 'shipment_status' && value === 'not_shipped') {
        newState[shipmentId] = {
          ...newState[shipmentId],
          container_number: null
        };
        
        toast({
          title: "Контейнер сброшен",
          description: "При смене статуса на 'Не отправлен' контейнер автоматически сброшен",
        });
      }

      return newState;
    });
  };

  const handleBulkAction = (action: 'mark_all_shipped' | 'mark_all_not_shipped' | 'clear_all_containers' | 'reset_all') => {
    switch (action) {
      case 'mark_all_shipped':
        const shippedUpdates = shipments.reduce((acc, shipment) => ({
          ...acc,
          [shipment.id]: { shipment_status: 'in_transit' }
        }), {});
        setEditedShipments(prev => ({ ...prev, ...shippedUpdates }));
        toast({ title: "Все места отмечены как отправленные" });
        break;

      case 'mark_all_not_shipped':
        const notShippedUpdates = shipments.reduce((acc, shipment) => ({
          ...acc,
          [shipment.id]: { 
            shipment_status: 'not_shipped',
            container_number: null
          }
        }), {});
        setEditedShipments(prev => ({ ...prev, ...notShippedUpdates }));
        toast({ title: "Все статусы и контейнеры сброшены" });
        break;

      case 'clear_all_containers':
        const clearedContainers = shipments.reduce((acc, shipment) => ({
          ...acc,
          [shipment.id]: { container_number: null }
        }), {});
        setEditedShipments(prev => ({ ...prev, ...clearedContainers }));
        toast({ title: "Все контейнеры очищены" });
        break;

      case 'reset_all':
        setEditedShipments({});
        toast({ title: "Изменения отменены" });
        break;
    }
  };

  const handleSave = async () => {
    const updates = Object.entries(editedShipments)
      .filter(([_, changes]) => Object.keys(changes).length > 0)
      .map(([id, updates]) => ({ id, updates }));

    if (updates.length === 0) {
      onClose();
      return;
    }

    try {
      await updateMultipleShipments(updates);
      toast({
        title: "Изменения сохранены",
        description: `Обновлено ${updates.length} мест`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Загрузка информации о местах...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-6xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {readOnly ? 'Просмотр мест заказа' : 'Управление местами заказа'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Warning for non-admin users */}
        {!readOnly && !isAdmin && isFieldsDisabled && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
            <div className="font-medium mb-1">Ограниченное редактирование</div>
            <div>Для полного редактирования установите общий статус заказа "Частично отправлен"</div>
          </div>
        )}

        {/* Overview */}
        <PlacesOverview 
          shipments={shipments}
          editedShipments={editedShipments}
        />

        {/* Bulk Actions */}
        {!readOnly && shipments.length > 1 && (
          <BulkActions
            shipments={shipments}
            onBulkAction={handleBulkAction}
            disabled={isFieldsDisabled || isUpdating}
            hasChanges={hasUnsavedChanges}
          />
        )}

        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
          <div className="lg:col-span-2">МЕСТО</div>
          <div className="lg:col-span-3">КОНТЕЙНЕР</div>
          <div className="lg:col-span-2">СТАТУС</div>
          <div className="lg:col-span-2">ИНДИКАТОР</div>
          <div className="lg:col-span-3">ОПИСАНИЕ</div>
        </div>

        {/* Places List */}
        <div className="space-y-2">
          {shipments.map((shipment) => (
            <PlaceRow
              key={shipment.id}
              shipment={shipment}
              containers={containers || []}
              editedShipments={editedShipments}
              onFieldChange={handleFieldChange}
              readOnly={readOnly}
              isFieldsDisabled={isFieldsDisabled}
            />
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            {readOnly ? 'Закрыть' : 'Отмена'}
          </Button>
          {!readOnly && (
            <Button 
              onClick={handleSave} 
              disabled={isUpdating || !hasUnsavedChanges}
              className="min-w-[140px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Сохранение...' : `Сохранить ${hasUnsavedChanges ? `(${Object.keys(editedShipments).length})` : ''}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};