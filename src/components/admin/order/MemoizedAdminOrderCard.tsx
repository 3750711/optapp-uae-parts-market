
import React from 'react';
import { EnhancedAdminOrderCard } from './EnhancedAdminOrderCard';
import { Order } from '@/hooks/useOptimizedOrdersQuery';

interface MemoizedAdminOrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
}

export const MemoizedAdminOrderCard = React.memo<MemoizedAdminOrderCardProps>(({ 
  order, 
  onEdit, 
  onDelete,
  onViewDetails 
}) => {
  return (
    <EnhancedAdminOrderCard
      order={order}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetails={onViewDetails}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  const prevOrder = prevProps.order;
  const nextOrder = nextProps.order;
  
  return (
    prevOrder.id === nextOrder.id &&
    prevOrder.status === nextOrder.status &&
    prevOrder.created_at === nextOrder.created_at &&
    prevOrder.price === nextOrder.price &&
    prevOrder.delivery_price_confirm === nextOrder.delivery_price_confirm
  );
});

MemoizedAdminOrderCard.displayName = 'MemoizedAdminOrderCard';
