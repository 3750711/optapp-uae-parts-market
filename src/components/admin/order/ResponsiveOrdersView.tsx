
import React, { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';
import { ComponentFallback, EmptyState } from './FallbackComponents';

// Direct imports instead of lazy loading to avoid TypeScript issues
import { VirtualizedOrdersList } from './VirtualizedOrdersList';
import { MobileOrderCard } from './MobileOrderCard';
import { CompactMobileOrderCard } from './CompactMobileOrderCard';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>(isMobile ? 'list' : 'grid');

  // Memoize orders to prevent unnecessary re-renders
  const memoizedOrders = useMemo(() => orders, [orders]);

  if (!memoizedOrders || memoizedOrders.length === 0) {
    return (
      <EmptyState 
        message="Нет заказов для отображения"
        description="Попробуйте изменить фильтры поиска или создать новый заказ"
      />
    );
  }

  const renderMobileCard = (order: Order) => {
    try {
      if (viewMode === 'compact') {
        return (
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
        );
      } else {
        return (
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
        );
      }
    } catch (error) {
      console.error('Error rendering mobile card:', error);
      return <ComponentFallback componentName="MobileOrderCard" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop View Mode Toggle */}
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

      {/* Mobile Actions Bar */}
      {isMobile && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Найдено: {memoizedOrders.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'compact' : 'list')}
              className="h-8 text-xs px-3"
            >
              {viewMode === 'list' ? (
                <>
                  <Grid className="h-3 w-3 mr-1" />
                  Компактно
                </>
              ) : (
                <>
                  <List className="h-3 w-3 mr-1" />
                  Подробно
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Orders Display */}
      {isMobile ? (
        <div className="space-y-3">
          {memoizedOrders.map((order) => renderMobileCard(order))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {memoizedOrders.map((order) => renderMobileCard(order))}
        </div>
      ) : (
        <VirtualizedOrdersList
          orders={memoizedOrders}
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
