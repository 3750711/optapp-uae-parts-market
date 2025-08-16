import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrderShipmentSummary } from "@/hooks/useOrderShipmentSummary";

type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';

interface DynamicShipmentStatusProps {
  orderId: string;
  fallbackStatus: ShipmentStatus;
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

export const DynamicShipmentStatus: React.FC<DynamicShipmentStatusProps> = ({
  orderId,
  fallbackStatus,
  onStatusChange
}) => {
  const { data: summary, isLoading } = useOrderShipmentSummary(orderId);

  // Use calculated status if order has shipments, otherwise use fallback from order table
  const displayStatus = summary && summary.totalPlaces > 0 ? summary.calculatedStatus : fallbackStatus;

  return (
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
        {summary && summary.totalPlaces > 1 && (
          <SelectItem value="partially_shipped">Частично отправлен</SelectItem>
        )}
        <SelectItem value="in_transit">Отправлен</SelectItem>
      </SelectContent>
    </Select>
  );
};