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

type ContainerStatus = 'waiting' | 'sent_from_uae' | 'transit_iran' | 'to_kazakhstan' | 'customs' | 'cleared_customs' | 'received';
type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';

interface VirtualizedLogisticsTableProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectOrder: (orderId: string) => void;
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
  getCompactOrderInfo: (order: Order) => { buyerInfo: string; sellerInfo: string };
}

export const VirtualizedLogisticsTable = memo<VirtualizedLogisticsTableProps>(({
  orders,
  selectedOrders,
  onSelectOrder,
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
  getCompactOrderInfo,
}) => {
  const ROW_HEIGHT = 80;
  const CONTAINER_HEIGHT = Math.min(600, window.innerHeight - 400);

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
        <div className="flex items-center justify-center w-[40px] px-2 flex-shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectOrder(order.id)}
          />
        </div>

        {/* Order Number */}
        <div className="flex items-center w-[100px] px-4 font-medium text-sm flex-shrink-0">
          {order.order_number}
        </div>

        {/* Seller */}
        <div className="flex items-center min-w-[200px] px-4 text-sm flex-shrink-0">
          {sellerInfo}
        </div>

        {/* Buyer */}
        <div className="flex items-center min-w-[200px] px-4 text-sm flex-shrink-0">
          {buyerInfo}
        </div>

        {/* Title */}
        <div className="flex items-center min-w-[200px] px-4 text-sm truncate flex-shrink-0" title={order.title}>
          {order.title || 'Нет названия'}
        </div>

        {/* Price */}
        <div className="flex items-center w-[100px] px-4 text-sm flex-shrink-0">
          {order.price ? 
            order.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
            : '-'
          }
        </div>

        {/* Place Number */}
        <div className="flex items-center w-[80px] px-4 text-sm flex-shrink-0">
          {order.place_number}
        </div>

        {/* Delivery Price */}
        <div className="flex items-center w-[100px] px-4 text-sm flex-shrink-0">
          {order.delivery_price_confirm ? 
            `$${order.delivery_price_confirm}` : 
            '-'
          }
        </div>

        {/* Order Status */}
        <div className="flex items-center w-[120px] px-4 text-sm flex-shrink-0">
          <OrderStatusBadge status={order.status as any} />
        </div>

        {/* Container Number */}
        <div className="flex items-center min-w-[200px] px-4 text-sm flex-shrink-0">
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
        <div className="flex items-center min-w-[150px] px-4 text-sm flex-shrink-0">
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
        <div className="flex items-center min-w-[150px] px-4 text-sm flex-shrink-0">
          <SmartShipmentStatus
            orderId={order.id}
            fallbackStatus={(order.shipment_status as ShipmentStatus) || 'not_shipped'}
            placeNumber={order.place_number || 1}
            onStatusChange={(status) => onUpdateShipmentStatus(order.id, status)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center w-[100px] px-4 flex-shrink-0">
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
    <div className="rounded-md border">
      {/* Table Header */}
      <div className="flex items-stretch border-b bg-muted/50 font-medium text-sm">
        <div className="flex items-center justify-center w-[40px] px-2 flex-shrink-0"></div>
        <div className="flex items-center w-[100px] px-4 flex-shrink-0">№ заказа</div>
        <div className="flex items-center min-w-[200px] px-4 flex-shrink-0">Продавец</div>
        <div className="flex items-center min-w-[200px] px-4 flex-shrink-0">Покупатель</div>
        <div className="flex items-center min-w-[200px] px-4 flex-shrink-0">Наименование</div>
        <div className="flex items-center w-[100px] px-4 flex-shrink-0">Цена ($)</div>
        <div className="flex items-center w-[80px] px-4 flex-shrink-0">Мест</div>
        <div className="flex items-center w-[100px] px-4 flex-shrink-0">Доставка</div>
        <div className="flex items-center w-[120px] px-4 flex-shrink-0">Статус заказа</div>
        <div className="flex items-center min-w-[200px] px-4 flex-shrink-0">Контейнер</div>
        <div className="flex items-center min-w-[150px] px-4 flex-shrink-0">Статус контейнера</div>
        <div className="flex items-center min-w-[150px] px-4 flex-shrink-0">Статус отгрузки</div>
        <div className="flex items-center w-[100px] px-4 flex-shrink-0">Действия</div>
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
