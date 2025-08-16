import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrderShipmentSummary } from "@/hooks/useOrderShipmentSummary";
import { Loader2 } from "lucide-react";

type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';

interface SmartShipmentStatusProps {
  orderId: string;
  fallbackStatus: ShipmentStatus;
  placeNumber: number;
  onStatusChange: (status: ShipmentStatus) => void;
}

const getShipmentStatusLabel = (status: ShipmentStatus | null) => {
  switch (status) {
    case 'not_shipped':
      return 'Не отправлен';
    case 'partially_shipped':
      return 'Частично отправлен';
    case 'in_transit':
      return 'Отправлен';
    default:
      return 'Не указан';
  }
};

const getShipmentStatusColor = (status: ShipmentStatus | null) => {
  switch (status) {
    case 'not_shipped':
      return 'text-red-600';
    case 'partially_shipped':
      return 'text-orange-600 font-semibold';
    case 'in_transit':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const getStatusBadgeVariant = (status: 'not_shipped' | 'in_transit') => {
  return status === 'in_transit' ? 'success' : 'secondary';
};

export const SmartShipmentStatus: React.FC<SmartShipmentStatusProps> = ({
  orderId,
  fallbackStatus,
  placeNumber,
  onStatusChange
}) => {
  const { data: summary, isLoading } = useOrderShipmentSummary(orderId);

  // Use calculated status if order has shipments, otherwise use fallback from order table
  const displayStatus = summary && summary.totalPlaces > 0 ? summary.calculatedStatus : fallbackStatus;

  const renderCompactInfo = () => {
    if (isLoading) {
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    }

    if (!summary || summary.totalPlaces === 0 || placeNumber === 1) {
      return null;
    }

    return (
      <div className="flex flex-col gap-1 mt-1">
        <div className="text-xs text-muted-foreground">
          {summary.shippedPlaces > 0 && summary.notShippedPlaces > 0 ? (
            <div className="flex flex-wrap gap-1">
              {summary.containerInfo.map((container, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge 
                    variant={getStatusBadgeVariant(container.status)}
                    className="text-xs px-1 py-0"
                  >
                    {container.containerNumber || 'Без №'}: {container.placesCount}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <span>
              {summary.shippedPlaces === summary.totalPlaces ? 
                'Все места отправлены' : 
                'Ни одно место не отправлено'
              }
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <Select
        value={displayStatus}
        onValueChange={(value) => onStatusChange(value as ShipmentStatus)}
      >
        <SelectTrigger className={`w-[140px] h-8 text-sm ${getShipmentStatusColor(displayStatus)}`}>
          <SelectValue>
            {isLoading ? 'Загрузка...' : getShipmentStatusLabel(displayStatus)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not_shipped">Не отправлен</SelectItem>
          <SelectItem value="partially_shipped">Частично отправлен</SelectItem>
          <SelectItem value="in_transit">Отправлен</SelectItem>
        </SelectContent>
      </Select>
      {renderCompactInfo()}
    </div>
  );
};