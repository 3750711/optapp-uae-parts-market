import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineEditableTextarea } from '@/components/ui/InlineEditableTextarea';
import { Container, Package, AlertTriangle } from 'lucide-react';
import { OrderShipment } from '@/hooks/useOrderShipments';
import { useToast } from '@/hooks/use-toast';

interface PlaceRowProps {
  shipment: OrderShipment;
  containers: any[];
  editedShipments: Record<string, Partial<OrderShipment>>;
  onFieldChange: (shipmentId: string, field: keyof OrderShipment, value: any) => void;
  readOnly: boolean;
  isFieldsDisabled: boolean;
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

const getShipmentStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'not_shipped': return 'destructive';
    case 'in_transit': return 'secondary';
    default: return 'outline';
  }
};

export const PlaceRow: React.FC<PlaceRowProps> = ({
  shipment,
  containers,
  editedShipments,
  onFieldChange,
  readOnly,
  isFieldsDisabled
}) => {
  const { toast } = useToast();
  
  const getEditedValue = (field: keyof OrderShipment, defaultValue: any) => {
    return editedShipments[shipment.id]?.[field] ?? defaultValue;
  };

  const currentStatus = getEditedValue('shipment_status', shipment.shipment_status);
  const currentContainer = getEditedValue('container_number', shipment.container_number);
  const currentDescription = getEditedValue('description', shipment.description);

  // Check for inconsistent state
  const hasInconsistentState = currentStatus === 'in_transit' && !currentContainer;

  const handleContainerChange = (value: string) => {
    const containerNumber = value === 'none' ? null : value;
    onFieldChange(shipment.id, 'container_number', containerNumber);
    
    // Auto-set status to in_transit if container is selected
    if (containerNumber && currentStatus === 'not_shipped') {
      onFieldChange(shipment.id, 'shipment_status', 'in_transit');
      toast({
        title: "Статус обновлен",
        description: "При выборе контейнера статус автоматически изменен на 'Отправлен'",
      });
    }
  };

  const handleStatusChange = (value: string) => {
    // Prevent setting in_transit without container
    if (value === 'in_transit' && !currentContainer) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Невозможно установить статус 'Отправлен' без указания контейнера. Сначала выберите контейнер.",
      });
      return;
    }
    
    onFieldChange(shipment.id, 'shipment_status', value);
  };

  const handleDescriptionSave = async (value: string) => {
    onFieldChange(shipment.id, 'description', value || null);
  };

  return (
    <div className={`group border rounded-lg p-4 transition-all hover:border-primary/30 hover:shadow-sm ${hasInconsistentState ? 'border-destructive/30 bg-destructive/5' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Inconsistent State Warning */}
        {hasInconsistentState && (
          <div className="lg:col-span-12 flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Внимание:</span>
            <span>Товар отмечен как отправленный, но не указан контейнер</span>
          </div>
        )}
        
        {/* Place Number */}
        <div className="lg:col-span-2 flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Место {shipment.place_number}</span>
        </div>

        {/* Container */}
        <div className="lg:col-span-3">
          <Select
            key={`${shipment.id}-${currentStatus}`}
            value={currentContainer || 'none'}
            onValueChange={readOnly || isFieldsDisabled ? undefined : handleContainerChange}
            disabled={readOnly || isFieldsDisabled}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Контейнер не указан" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Container className="h-3 w-3" />
                  Не указан
                </div>
              </SelectItem>
              {containers?.map((container) => (
                <SelectItem key={container.id} value={container.container_number}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Container className="h-3 w-3" />
                      <span>{container.container_number}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {getContainerStatusLabel(container.status)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="lg:col-span-2">
          <Select
            value={currentStatus}
            onValueChange={readOnly || isFieldsDisabled ? undefined : handleStatusChange}
            disabled={readOnly || isFieldsDisabled}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_shipped">Не отправлен</SelectItem>
              <SelectItem value="in_transit">Отправлен</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Badge */}
        <div className="lg:col-span-2">
          <Badge 
            variant={getShipmentStatusVariant(currentStatus)}
            className="w-full justify-center"
          >
            {getShipmentStatusLabel(currentStatus)}
          </Badge>
        </div>

        {/* Description */}
        <div className="lg:col-span-3">
          {readOnly || isFieldsDisabled ? (
            <div className="min-h-[32px] text-sm text-muted-foreground p-2 bg-muted/30 rounded border">
              {currentDescription || "Нет описания"}
            </div>
          ) : (
            <InlineEditableTextarea
              value={currentDescription || ''}
              onSave={handleDescriptionSave}
              placeholder="Описание товара..."
              className="min-h-[32px] text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
};