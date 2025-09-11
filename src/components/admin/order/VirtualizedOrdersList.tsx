
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { OptimizedOrderCard } from './OptimizedOrderCard';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import { Checkbox } from '@/components/ui/checkbox';

interface VirtualizedOrdersListProps {
  orders: Order[];
  selectedOrders?: string[];
  onSelectOrder?: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  containerHeight?: number;
}

const CARD_HEIGHT = 350;
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
        <OptimizedOrderCard
          order={order}
          isSelected={isSelected}
          onSelect={onSelectOrder}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
          showSelection={!!onSelectOrder}
        />
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
            <OptimizedOrderCard
              key={order.id}
              order={order}
              isSelected={isSelected}
              onSelect={onSelectOrder}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              showSelection={!!onSelectOrder}
            />
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
