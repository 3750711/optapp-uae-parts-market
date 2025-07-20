
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { OrdersTable } from './OrdersTable';
import { MobileOrderCard } from './MobileOrderCard';
import { CompactMobileOrderCard } from './CompactMobileOrderCard';
import { Order } from '@/hooks/useOptimizedOrdersQuery';

interface ResponsiveOrdersViewProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectOrder: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  onQuickAction?: (orderId: string, action: string) => void;
  quickActionLoading?: {
    isLoading: boolean;
    orderId: string;
    action: string;
  };
}

export const ResponsiveOrdersView: React.FC<ResponsiveOrdersViewProps> = ({
  orders,
  selectedOrders,
  onSelectOrder,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickAction,
  quickActionLoading
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Определяем какой тип карточки использовать на основе размера экрана
    const isCompact = window.innerWidth < 400;
    
    return (
      <div className="space-y-3">
        {orders.map((order) => 
          isCompact ? (
            <CompactMobileOrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrders.includes(order.id)}
              onSelect={onSelectOrder}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              onQuickAction={onQuickAction}
              quickActionLoading={quickActionLoading}
            />
          ) : (
            <MobileOrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrders.includes(order.id)}
              onSelect={onSelectOrder}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              onQuickAction={onQuickAction}
              quickActionLoading={quickActionLoading}
            />
          )
        )}
      </div>
    );
  }

  return (
    <OrdersTable
      orders={orders}
      selectedOrders={selectedOrders}
      onSelectOrder={onSelectOrder}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetails={onViewDetails}
      onQuickAction={onQuickAction}
    />
  );
};
