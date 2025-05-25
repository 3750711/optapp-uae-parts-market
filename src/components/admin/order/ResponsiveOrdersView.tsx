
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { VirtualizedOrdersList } from './VirtualizedOrdersList';
import { MobileOrderCard } from './MobileOrderCard';
import { CompactMobileOrderCard } from './CompactMobileOrderCard';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';
import { useState } from 'react';

interface ResponsiveOrdersViewProps {
  orders: Order[];
  selectedOrders?: string[];
  onSelectOrder?: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  onQuickAction?: (orderId: string, action: string) => void;
  containerHeight?: number;
}

export const ResponsiveOrdersView: React.FC<ResponsiveOrdersViewProps> = ({
  orders,
  selectedOrders = [],
  onSelectOrder,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickAction,
  containerHeight = 600
}) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>(isMobile ? 'compact' : 'grid');

  if (orders.length === 0) {
    return (
      <div className="col-span-3 text-center py-20">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
          <p className="text-lg text-muted-foreground">
            Нет заказов для отображения
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      {!isMobile && (
        <div className="flex items-center justify-end">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile View Mode Toggle */}
      {isMobile && (
        <div className="flex items-center justify-end">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
              className="h-8 text-xs px-2"
            >
              Компактно
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 text-xs px-2"
            >
              Подробно
            </Button>
          </div>
        </div>
      )}

      {/* Orders Display */}
      {isMobile ? (
        <div className="space-y-3">
          {orders.map((order) => 
            viewMode === 'compact' ? (
              <CompactMobileOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={onSelectOrder || (() => {})}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onQuickAction={onQuickAction}
              />
            ) : (
              <MobileOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={onSelectOrder || (() => {})}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onQuickAction={onQuickAction}
              />
            )
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <MobileOrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrders.includes(order.id)}
              onSelect={onSelectOrder || (() => {})}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              onQuickAction={onQuickAction}
            />
          ))}
        </div>
      ) : (
        <VirtualizedOrdersList
          orders={orders}
          selectedOrders={selectedOrders}
          onSelectOrder={onSelectOrder}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
          containerHeight={containerHeight}
        />
      )}
    </div>
  );
};
