import React from 'react';
import { Badge } from "@/components/ui/badge";
import { useOrderShipmentSummary } from "@/hooks/useOrderShipmentSummary";
import { Loader2 } from "lucide-react";

interface CompactShipmentInfoProps {
  orderId: string;
  placeNumber: number;
}

export const CompactShipmentInfo: React.FC<CompactShipmentInfoProps> = ({ orderId, placeNumber }) => {
  const { data: summary, isLoading } = useOrderShipmentSummary(orderId);

  if (isLoading) {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  }

  if (!summary || summary.totalPlaces === 0) {
    return <span className="text-xs text-muted-foreground">Нет данных</span>;
  }

  // If it's a single place order, don't show detailed breakdown
  if (placeNumber === 1) {
    return null;
  }

  // Show compact summary for multi-place orders
  const getStatusBadgeVariant = (status: 'not_shipped' | 'in_transit') => {
    return status === 'in_transit' ? 'success' : 'secondary';
  };

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