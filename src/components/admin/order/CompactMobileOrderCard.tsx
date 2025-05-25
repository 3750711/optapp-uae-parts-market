
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, CheckCircle, Eye, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderPriorityIndicator } from './OrderPriorityIndicator';
import { EnhancedOrderStatusBadge } from './EnhancedOrderStatusBadge';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CompactMobileOrderCardProps {
  order: Order;
  isSelected: boolean;
  onSelect: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  onQuickAction?: (orderId: string, action: string) => void;
}

export const CompactMobileOrderCard: React.FC<CompactMobileOrderCardProps> = ({
  order,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickAction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalValue = Number(order.price || 0) + Number(order.delivery_price_confirm || 0);
  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';

  return (
    <Card className={`
      transition-all duration-200 
      ${isSelected ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : 'hover:shadow-md'}
    `}>
      <CardContent className="p-4">
        {/* Primary Info Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(order.id)}
              className="shrink-0 mt-1"
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs shrink-0">
                  №{order.order_number}
                </Badge>
                <OrderPriorityIndicator
                  createdAt={order.created_at}
                  status={order.status}
                  totalValue={totalValue}
                />
              </div>
              
              <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                {order.title || 'Без названия'}
              </h3>
              
              {(order.brand || order.model) && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {[order.brand, order.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <EnhancedOrderStatusBadge status={order.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(order.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Детали
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(order)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                {showConfirmButton && onQuickAction && (
                  <DropdownMenuItem onClick={() => onQuickAction(order.id, 'confirm')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Подтвердить
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(order)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Essential Info Row */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Цена</div>
              <div className="font-semibold text-primary">
                ${order.price?.toLocaleString() || '0'}
              </div>
            </div>
            
            {order.delivery_price_confirm && order.delivery_price_confirm > 0 && (
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Доставка</div>
                <div className="font-medium">
                  ${order.delivery_price_confirm.toLocaleString()}
                </div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Мест</div>
              <div className="font-medium">
                {order.place_number || 0}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit'
            })}
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-8 text-xs justify-center gap-1"
            >
              {isExpanded ? 'Скрыть детали' : 'Показать детали'}
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-3 pt-3 border-t">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Продавец</div>
                <div className="font-medium text-xs">
                  {order.seller?.full_name || 'Не указан'}
                </div>
                {order.seller?.opt_id && (
                  <div className="text-xs text-muted-foreground">
                    ID: {order.seller.opt_id}
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">Покупатель</div>
                <div className="font-medium text-xs">
                  {order.buyer?.full_name || 'Не указан'}
                </div>
                {order.buyer?.opt_id && (
                  <div className="text-xs text-muted-foreground">
                    ID: {order.buyer.opt_id}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {order.text_order && order.text_order.trim() && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Дополнительная информация</div>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {order.text_order}
                </p>
              </div>
            )}

            {/* Full Timestamp */}
            <div className="text-xs text-muted-foreground">
              Создан: {new Date(order.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
