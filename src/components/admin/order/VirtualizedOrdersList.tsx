import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { MemoizedAdminOrderCard } from './MemoizedAdminOrderCard';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import { Checkbox } from '@/components/ui/checkbox';
import { OrderPriorityIndicator } from './OrderPriorityIndicator';

interface VirtualizedOrdersListProps {
  orders: Order[];
  selectedOrders?: string[];
  onSelectOrder?: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  containerHeight?: number;
}

const CARD_HEIGHT = 400;
const CARD_WIDTH = 400;
const GAP = 24;

export const VirtualizedOrdersList: React.FC<VirtualizedOrdersListProps> = ({
  orders,
  selectedOrders = [],
  onSelectOrder,
  onEdit,
  onDelete,
  onViewDetails,
  containerHeight = 600
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200); // Default width

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const { columnCount, rowCount } = useMemo(() => {
    const cols = Math.max(1, Math.floor(containerWidth / (CARD_WIDTH + GAP)));
    const rows = Math.ceil(orders.length / cols);
    return { columnCount: cols, rowCount: rows };
  }, [orders.length, containerWidth]);

  const Cell = React.memo(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const order = orders[index];

    if (!order) return null;

    const isSelected = selectedOrders.includes(order.id);

    return (
      <div style={{
        ...style,
        padding: GAP / 2,
        left: style.left + GAP / 2,
        top: style.top + GAP / 2,
        width: style.width - GAP,
        height: style.height - GAP,
      }}>
        <div className={`relative ${isSelected ? 'ring-2 ring-primary ring-opacity-50' : ''}`}>
          {onSelectOrder && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectOrder(order.id)}
                className="bg-white shadow-sm"
              />
            </div>
          )}
          
          <div className="absolute top-2 right-2 z-10">
            <OrderPriorityIndicator
              createdAt={order.created_at}
              status={order.status}
              totalValue={order.price || 0}
            />
          </div>
          
          <MemoizedAdminOrderCard
            order={order}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    );
  });

  Cell.displayName = 'VirtualizedCell';

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

  // For small lists, use regular grid
  if (orders.length <= 20) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => {
          const isSelected = selectedOrders.includes(order.id);
          return (
            <div key={order.id} className={`relative ${isSelected ? 'ring-2 ring-primary ring-opacity-50' : ''}`}>
              {onSelectOrder && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectOrder(order.id)}
                    className="bg-white shadow-sm"
                  />
                </div>
              )}
              
              <div className="absolute top-2 right-2 z-10">
                <OrderPriorityIndicator
                  createdAt={order.created_at}
                  status={order.status}
                  totalValue={order.price || 0}
                />
              </div>
              
              <MemoizedAdminOrderCard
                order={order}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={CARD_WIDTH + GAP}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT + GAP}
        width={containerWidth}
      >
        {Cell}
      </Grid>
    </div>
  );
};
