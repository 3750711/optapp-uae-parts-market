import { ContainersList } from "./ContainersList";
import { OrderShipmentSummary } from "@/hooks/useBatchOrderShipmentSummary";

interface ContainerEditableWrapperProps {
  orderId: string;
  fallbackContainerNumber: string | null;
  shipmentStatus: string | null;
  summary?: OrderShipmentSummary;
  onEdit: () => void;
}

export const ContainerEditableWrapper: React.FC<ContainerEditableWrapperProps> = ({
  orderId,
  fallbackContainerNumber,
  shipmentStatus,
  summary,
  onEdit
}) => {
  
  // Check if order has multiple containers
  const hasMultipleContainers = summary?.containers_info && summary.containers_info.length > 1;
  
  // Block editing if:
  // 1. Order is partially_shipped (existing logic)
  // 2. Order is in_transit AND has multiple containers (new logic)
  const isEditBlocked = shipmentStatus === 'partially_shipped' || 
                       (shipmentStatus === 'in_transit' && hasMultipleContainers);

  return (
    <div 
      className={isEditBlocked ? '' : 'cursor-pointer hover:text-primary'}
      onClick={isEditBlocked ? undefined : onEdit}
    >
      <ContainersList 
        orderId={orderId}
        fallbackContainerNumber={fallbackContainerNumber}
        isPartiallyShipped={shipmentStatus === 'partially_shipped'}
      />
    </div>
  );
};