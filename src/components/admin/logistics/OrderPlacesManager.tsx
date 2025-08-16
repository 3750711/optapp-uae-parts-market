import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Package, Container, Save, X } from 'lucide-react';
import { useOrderShipments, OrderShipment } from '@/hooks/useOrderShipments';
import { useContainers } from '@/hooks/useContainers';

interface OrderPlacesManagerProps {
  orderId: string;
  onClose: () => void;
  readOnly?: boolean;
  orderShipmentStatus?: 'not_shipped' | 'partially_shipped' | 'in_transit';
}

const getContainerStatusLabel = (status: string) => {
  switch (status) {
    case 'waiting': return 'Ожидание';
    case 'sent_from_uae': return 'Отправлен из ОАЭ';
    case 'transit_iran': return 'Транзит Иран';
    case 'to_kazakhstan': return 'Следует в Казахстан';
    case 'customs': return 'Таможня';
    case 'cleared_customs': return 'Вышел с таможни';
    case 'received': return 'Получен';
    default: return status;
  }
};

const getShipmentStatusLabel = (status: string) => {
  switch (status) {
    case 'not_shipped': return 'Не отправлен';
    case 'in_transit': return 'Отправлен';
    default: return status;
  }
};

const getShipmentStatusColor = (status: string) => {
  switch (status) {
    case 'not_shipped': return 'bg-red-50 text-red-700 border-red-200';
    case 'in_transit': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const OrderPlacesManager: React.FC<OrderPlacesManagerProps> = ({ 
  orderId, 
  onClose, 
  readOnly = false, 
  orderShipmentStatus 
}) => {
  const { shipments, isLoading, updateMultipleShipments, isUpdating } = useOrderShipments(orderId);
  const { containers, isLoading: containersLoading } = useContainers();
  const [editedShipments, setEditedShipments] = useState<Record<string, Partial<OrderShipment>>>({});

  // Check if container and description fields should be disabled
  const isFieldsDisabled = orderShipmentStatus !== 'partially_shipped';

  const handleFieldChange = (shipmentId: string, field: keyof OrderShipment, value: any) => {
    setEditedShipments(prev => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        [field]: value
      }
    }));
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
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getEditedValue = (shipmentId: string, field: keyof OrderShipment, defaultValue: any) => {
    return editedShipments[shipmentId]?.[field] ?? defaultValue;
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {readOnly ? 'Просмотр мест заказа' : 'Управление местами заказа'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          {readOnly ? 'Просмотр информации о местах заказа.' : 'Управляйте каждым местом отдельно, указывая контейнер и статус для каждого места.'}
          {!readOnly && isFieldsDisabled && (
            <div className="text-xs text-orange-600 mt-1">
              Для редактирования контейнеров, статусов отгрузки и описаний установите общий статус заказа "Частично отправлен"
            </div>
          )}
        </div>
        
        <div className="grid gap-4">
          {shipments.map((shipment) => (
            <Card key={shipment.id} className="border-l-4 border-l-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Container className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Место {shipment.place_number}</span>
                  </div>
                  <Badge className={getShipmentStatusColor(getEditedValue(shipment.id, 'shipment_status', shipment.shipment_status))}>
                    {getShipmentStatusLabel(getEditedValue(shipment.id, 'shipment_status', shipment.shipment_status))}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Номер контейнера</label>
                    <Select
                      value={getEditedValue(shipment.id, 'container_number', shipment.container_number) || 'none'}
                      onValueChange={readOnly || isFieldsDisabled ? undefined : (value) => handleFieldChange(shipment.id, 'container_number', value === 'none' ? null : value)}
                      disabled={readOnly || isFieldsDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите контейнер" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не указан</SelectItem>
                        {containers?.map((container) => (
                          <SelectItem key={container.id} value={container.container_number}>
                            <div className="flex items-center justify-between w-full">
                              <span>{container.container_number}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({getContainerStatusLabel(container.status)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Статус отгрузки</label>
                    <Select
                      value={getEditedValue(shipment.id, 'shipment_status', shipment.shipment_status)}
                      onValueChange={readOnly || isFieldsDisabled ? undefined : (value) => handleFieldChange(shipment.id, 'shipment_status', value)}
                      disabled={readOnly || isFieldsDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_shipped">Не отправлен</SelectItem>
                        <SelectItem value="in_transit">Отправлен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium">Описание товара в этом месте</label>
                  <Textarea
                    placeholder={readOnly || isFieldsDisabled ? "Нет описания" : "Опишите что находится в этом месте..."}
                    value={getEditedValue(shipment.id, 'description', shipment.description) || ''}
                    onChange={readOnly || isFieldsDisabled ? undefined : (e) => handleFieldChange(shipment.id, 'description', e.target.value || null)}
                    readOnly={readOnly || isFieldsDisabled}
                    disabled={readOnly || isFieldsDisabled}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {readOnly ? 'Закрыть' : 'Отмена'}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};