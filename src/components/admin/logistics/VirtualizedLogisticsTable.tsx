import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Order } from '@/hooks/useServerFilteredOrders';
import { TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Eye, Package, Save } from 'lucide-react';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartShipmentStatus } from "@/components/admin/logistics/SmartShipmentStatus";
import { ContainerEditableWrapper } from "@/components/admin/logistics/ContainerEditableWrapper";
import { Database } from "@/integrations/supabase/types";
import { ResizableTableHead } from '@/components/ui/resizable-table-head';

type ContainerStatus = 'waiting' | 'sent_from_uae' | 'transit_iran' | 'to_kazakhstan' | 'customs' | 'cleared_customs' | 'received';
type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';

interface VirtualizedLogisticsTableProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectOrder: (orderId: string) => void;
  onSelectAll: () => void;
  onViewDetails: (orderId: string) => void;
  onManagePlaces: (orderId: string) => void;
  editingContainer: string | null;
  tempContainerNumber: string;
  onEditContainer: (orderId: string, containerNumber: string) => void;
  onSaveContainer: (orderId: string, containerNumber: string) => void;
  onTempContainerChange: (value: string) => void;
  containers: Database['public']['Tables']['containers']['Row'][] | null;
  getStatusColor: (status: ContainerStatus | null) => string;
  getStatusLabel: (status: ContainerStatus | null) => string;
  shipmentSummaries: Map<string, any> | undefined;
  onUpdateShipmentStatus: (orderId: string, status: ShipmentStatus) => void;
  onToggleReadyForShipment: (orderId: string, currentValue: boolean) => void;
  getCompactOrderInfo: (order: Order) => { buyerInfo: string; sellerInfo: string };
  columnWidths: Record<string, number>;
  onResizeColumn: (columnId: string, width: number) => void;
}

export const VirtualizedLogisticsTable = memo<VirtualizedLogisticsTableProps>(({
  orders,
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  onViewDetails,
  onManagePlaces,
  editingContainer,
  tempContainerNumber,
  onEditContainer,
  onSaveContainer,
  onTempContainerChange,
  containers,
  getStatusColor,
  getStatusLabel,
  shipmentSummaries,
  onUpdateShipmentStatus,
  onToggleReadyForShipment,
  getCompactOrderInfo,
  columnWidths,
  onResizeColumn,
}) => {
  const ROW_HEIGHT = 80;
  const CONTAINER_HEIGHT = Math.min(600, window.innerHeight - 400);
  
  const isAllSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const isSomeSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const order = orders[index];
    const isSelected = selectedOrders.includes(order.id);
    const { buyerInfo, sellerInfo } = getCompactOrderInfo(order);

    return (
      <div 
        style={style} 
        className={`flex items-stretch border-b hover:bg-muted/50 ${isSelected ? 'bg-accent' : ''}`}
      >
        {/* Checkbox */}
        <div 
          className="flex items-center justify-center px-2 flex-shrink-0"
          style={{ width: columnWidths.checkbox, minWidth: columnWidths.checkbox }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectOrder(order.id)}
          />
        </div>

        {/* Actions */}
        <div 
          className="flex items-center px-4 flex-shrink-0"
          style={{ width: columnWidths.actions, minWidth: columnWidths.actions }}
        >
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewDetails(order.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {(order.shipment_status === 'partially_shipped' || order.shipment_status === 'not_shipped' || order.shipment_status === 'in_transit') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onManagePlaces(order.id)}
                title={order.shipment_status === 'partially_shipped' ? "Управлять местами" : "Просмотр мест"}
              >
                <Package className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Order Number */}
        <div 
          className="flex items-center px-4 font-medium text-sm flex-shrink-0"
          style={{ width: columnWidths.orderNumber, minWidth: columnWidths.orderNumber }}
        >
          {order.order_number}
        </div>

        {/* Seller */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.seller, minWidth: columnWidths.seller }}
        >
          {sellerInfo}
        </div>

        {/* Buyer */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.buyer, minWidth: columnWidths.buyer }}
        >
          {buyerInfo}
        </div>

        {/* Title */}
        <div 
          className="flex items-center px-4 text-sm truncate flex-shrink-0" 
          title={order.title}
          style={{ width: columnWidths.title, minWidth: columnWidths.title, maxWidth: columnWidths.title }}
        >
          {order.title || 'Нет названия'}
        </div>

        {/* Price */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.price, minWidth: columnWidths.price }}
        >
          {order.price ? 
            order.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
            : '-'
          }
        </div>

        {/* Place Number */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.placeNumber, minWidth: columnWidths.placeNumber }}
        >
          {order.place_number}
        </div>

        {/* Delivery Price */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.deliveryPrice, minWidth: columnWidths.deliveryPrice }}
        >
          {order.delivery_price_confirm ? 
            `$${order.delivery_price_confirm}` : 
            '-'
          }
        </div>

        {/* Order Status */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.orderStatus, minWidth: columnWidths.orderStatus }}
        >
          <OrderStatusBadge status={order.status as any} />
        </div>

        {/* Ready for Shipment */}
        <div 
          className="flex items-center justify-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.readyForShipment, minWidth: columnWidths.readyForShipment }}
        >
          <Checkbox
            checked={order.ready_for_shipment || false}
            onCheckedChange={() => onToggleReadyForShipment(order.id, order.ready_for_shipment || false)}
          />
        </div>

        {/* Container Number */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.containerNumber, minWidth: columnWidths.containerNumber }}
        >
          {editingContainer === order.id ? (
            <div className="flex items-center space-x-2">
              <Select
                value={tempContainerNumber || order.container_number || 'none'}
                onValueChange={onTempContainerChange}
              >
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue placeholder="Контейнер" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не указан</SelectItem>
                  {containers?.map((container) => (
                    <SelectItem key={container.id} value={container.container_number}>
                      <div className="flex items-center justify-between w-full">
                        <span>{container.container_number}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({getStatusLabel(container.status as any)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => onSaveContainer(order.id, tempContainerNumber)}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <ContainerEditableWrapper
              orderId={order.id}
              fallbackContainerNumber={order.container_number}
              shipmentStatus={order.shipment_status}
              summary={shipmentSummaries?.get(order.id)}
              onEdit={() => onEditContainer(order.id, order.container_number || '')}
            />
          )}
        </div>

        {/* Container Status */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.containerStatus, minWidth: columnWidths.containerStatus }}
        >
          <div className={getStatusColor(order.containers?.[0]?.status as ContainerStatus)}>
            {getStatusLabel(order.containers?.[0]?.status as ContainerStatus)}
            {order.containers && order.containers.length > 1 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{order.containers.length - 1}
              </span>
            )}
          </div>
        </div>

        {/* Shipment Status */}
        <div 
          className="flex items-center px-4 text-sm flex-shrink-0"
          style={{ width: columnWidths.shipmentStatus, minWidth: columnWidths.shipmentStatus }}
        >
          <SmartShipmentStatus
            orderId={order.id}
            fallbackStatus={(order.shipment_status as ShipmentStatus) || 'not_shipped'}
            placeNumber={order.place_number || 1}
            onStatusChange={(status) => onUpdateShipmentStatus(order.id, status)}
          />
        </div>
      </div>
    );
  });

  Row.displayName = 'VirtualizedTableRow';

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет заказов для отображения
      </div>
    );
  }

  return (
    <div className="rounded-md border -mx-2">
      {/* Table Header */}
      <div className="overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr className="flex items-stretch">
              <ResizableTableHead
                columnId="checkbox"
                width={columnWidths.checkbox}
                minWidth={40}
                onResize={onResizeColumn}
                className="border-0"
              >
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onCheckedChange={onSelectAll}
                />
              </ResizableTableHead>
              <ResizableTableHead
                columnId="actions"
                width={columnWidths.actions}
                minWidth={80}
                onResize={onResizeColumn}
                className="border-0"
              >
                Действия
              </ResizableTableHead>
              <ResizableTableHead
                columnId="orderNumber"
                width={columnWidths.orderNumber}
                minWidth={80}
                onResize={onResizeColumn}
                className="border-0"
              >
                № заказа
              </ResizableTableHead>
              <ResizableTableHead
                columnId="seller"
                width={columnWidths.seller}
                minWidth={10}
                onResize={onResizeColumn}
                className="border-0"
              >
                Прод.
              </ResizableTableHead>
              <ResizableTableHead
                columnId="buyer"
                width={columnWidths.buyer}
                minWidth={10}
                onResize={onResizeColumn}
                className="border-0"
              >
                Пок.
              </ResizableTableHead>
              <ResizableTableHead
                columnId="title"
                width={columnWidths.title}
                minWidth={115}
                onResize={onResizeColumn}
                className="border-0"
              >
                Наименование
              </ResizableTableHead>
              <ResizableTableHead
                columnId="price"
                width={columnWidths.price}
                minWidth={80}
                onResize={onResizeColumn}
                className="border-0"
              >
                Цена ($)
              </ResizableTableHead>
              <ResizableTableHead
                columnId="placeNumber"
                width={columnWidths.placeNumber}
                minWidth={10}
                onResize={onResizeColumn}
                className="border-0"
              >
                М
              </ResizableTableHead>
              <ResizableTableHead
                columnId="deliveryPrice"
                width={columnWidths.deliveryPrice}
                minWidth={80}
                onResize={onResizeColumn}
                className="border-0"
              >
                Доставка
              </ResizableTableHead>
              <ResizableTableHead
                columnId="orderStatus"
                width={columnWidths.orderStatus}
                minWidth={55}
                onResize={onResizeColumn}
                className="border-0"
              >
                Статус заказа
              </ResizableTableHead>
              <ResizableTableHead
                columnId="readyForShipment"
                width={columnWidths.readyForShipment}
                minWidth={50}
                onResize={onResizeColumn}
                className="border-0"
              >
                Готов
              </ResizableTableHead>
              <ResizableTableHead
                columnId="containerNumber"
                width={columnWidths.containerNumber}
                minWidth={10}
                onResize={onResizeColumn}
                className="border-0"
              >
                Конт.
              </ResizableTableHead>
              <ResizableTableHead
                columnId="containerStatus"
                width={columnWidths.containerStatus}
                minWidth={28}
                onResize={onResizeColumn}
                className="border-0"
              >
                Ст.конт.
              </ResizableTableHead>
              <ResizableTableHead
                columnId="shipmentStatus"
                width={columnWidths.shipmentStatus}
                minWidth={10}
                onResize={onResizeColumn}
                className="border-0"
              >
                Ст.отгр.
              </ResizableTableHead>
            </tr>
          </thead>
        </table>
      </div>

      {/* Virtualized Table Body */}
      <List
        height={CONTAINER_HEIGHT}
        width="100%"
        itemCount={orders.length}
        itemSize={ROW_HEIGHT}
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
});

VirtualizedLogisticsTable.displayName = 'VirtualizedLogisticsTable';
