import React from 'react';
import { useOrderShipmentSummary } from "@/hooks/useOrderShipmentSummary";

interface OrderShipmentStatusCheckerProps {
  orderId: string;
  fallbackStatus: 'not_shipped' | 'partially_shipped' | 'in_transit';
  onStatusCheck?: (calculatedStatus: 'not_shipped' | 'partially_shipped' | 'in_transit', hasShipments: boolean) => void;
  children: (status: 'not_shipped' | 'partially_shipped' | 'in_transit', hasShipments: boolean, isLoading: boolean) => React.ReactNode;
}

export const OrderShipmentStatusChecker: React.FC<OrderShipmentStatusCheckerProps> = ({
  orderId,
  fallbackStatus,
  onStatusCheck,
  children
}) => {
  const { data: summary, isLoading } = useOrderShipmentSummary(orderId);

  const hasShipments = summary && summary.totalPlaces > 0;
  const displayStatus = hasShipments ? summary.calculatedStatus : fallbackStatus;

  React.useEffect(() => {
    if (!isLoading && onStatusCheck) {
      onStatusCheck(displayStatus, hasShipments);
    }
  }, [displayStatus, hasShipments, isLoading, onStatusCheck]);

  return <>{children(displayStatus, hasShipments, isLoading)}</>;
};