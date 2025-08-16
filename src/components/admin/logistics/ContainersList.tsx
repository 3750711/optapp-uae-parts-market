import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Container, Package } from "lucide-react";
import { useOrderShipmentSummary } from "@/hooks/useOrderShipmentSummary";
import { Loader2 } from "lucide-react";

interface ContainersListProps {
  orderId: string;
  fallbackContainerNumber?: string | null;
  isPartiallyShipped?: boolean;
}

const getStatusBadgeVariant = (status: 'not_shipped' | 'in_transit') => {
  return status === 'in_transit' ? 'success' : 'secondary';
};


export const ContainersList: React.FC<ContainersListProps> = ({ 
  orderId, 
  fallbackContainerNumber,
  isPartiallyShipped 
}) => {
  const { data: summary, isLoading } = useOrderShipmentSummary(orderId);

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  // If not partially shipped or no container info, show fallback
  if (!isPartiallyShipped || !summary?.containerInfo || summary.containerInfo.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="truncate max-w-[120px]">
          {fallbackContainerNumber || 'Не указан'}
        </span>
        <Container className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  // Multiple containers - show detailed list
  if (summary.containerInfo.length > 1) {
    return (
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground mb-1">
          {summary.containerInfo.length} контейнера:
        </div>
        {summary.containerInfo.map((container, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <Badge 
              variant={getStatusBadgeVariant(container.status)}
              className="text-xs px-2 py-1"
            >
              {container.containerNumber || 'НО'}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>{container.placesCount}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single container with detailed info
  const container = summary.containerInfo[0];
  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={getStatusBadgeVariant(container.status)}
        className="text-xs"
      >
        {container.containerNumber || 'НО'}
      </Badge>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Package className="h-3 w-3" />
        <span>{container.placesCount}</span>
      </div>
    </div>
  );
};