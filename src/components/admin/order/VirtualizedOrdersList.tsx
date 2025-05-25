
import React, { useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { MemoizedAdminOrderCard } from './MemoizedAdminOrderCard';
import { Order } from '@/hooks/useOptimizedOrdersQuery';

interface VirtualizedOrdersListProps {
  orders: Order[];
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
  onEdit,
  onDelete,
  onViewDetails,
  containerHeight = 600
}) => {
  const { columnCount, rowCount } = useMemo(() => {
    // Calculate based on container width - defaulting to 3 columns for now
    const cols = 3;
    const rows = Math.ceil(orders.length / cols);
    return { columnCount: cols, rowCount: rows };
  }, [orders.length]);

  const Cell = React.memo(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const order = orders[index];

    if (!order) return null;

    return (
      <div style={{
        ...style,
        padding: GAP / 2,
        left: style.left + GAP / 2,
        top: style.top + GAP / 2,
        width: style.width - GAP,
        height: style.height - GAP,
      }}>
        <MemoizedAdminOrderCard
          order={order}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
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
        {orders.map((order) => (
          <MemoizedAdminOrderCard
            key={order.id}
            order={order}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    );
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={CARD_WIDTH + GAP}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={CARD_HEIGHT + GAP}
      width="100%"
    >
      {Cell}
    </Grid>
  );
};
