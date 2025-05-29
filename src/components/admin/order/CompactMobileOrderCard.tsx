
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
      <CardContent className="p-3">
        {/* Header Block */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(order.id)}
              className="shrink-0"
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs shrink-0 font-mono">
                  №{order.order_number}
                </Badge>
                <OrderPriorityIndicator
                  createdAt={order.created_at}
                  status={order.status}
                  totalValue={totalValue}
                />
              </div>
              
              <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-1">
                {order.title || 'Без названия'}
              </h3>
              
              <div className="flex items-center justify-between">
                <EnhancedOrderStatusBadge status={order.status} />
                <span className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

        {/* Info Block */}
        <div className="space-y-3">
          {/* Product Info */}
          {(order.brand || order.model) && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
              {[order.brand, order.model].filter(Boolean).join(' ')}
            </div>
          )}

          {/* Price Block */}
          <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Цена</div>
                <div className="font-bold text-primary text-sm">
                  ${order.price?.toLocaleString() || '0'}
                </div>
              </div>
              
              {order.delivery_price_confirm && order.delivery_price_confirm > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Доставка</div>
                  <div className="font-semibold text-sm">
                    ${order.delivery_price_confirm.toLocaleString()}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">Мест</div>
                <div className="font-semibold text-sm">
                  {order.place_number || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Action Block */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(order.id)}
              className="flex-1 h-9 text-xs font-medium"
            >
              <Eye className="h-3 w-3 mr-1" />
              Просмотр
            </Button>
            
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-3 text-xs"
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Expandable Details */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="space-y-3">
              {/* Users Block */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 rounded-lg p-3">
                <div>
                  <div className="text-muted-foreground mb-1 font-medium">Продавец</div>
                  <div className="font-medium">
                    {order.seller?.full_name || 'Не указан'}
                  </div>
                  {order.seller?.opt_id && (
                    <div className="text-muted-foreground font-mono">
                      {order.seller.opt_id}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-muted-foreground mb-1 font-medium">Покупатель</div>
                  <div className="font-medium">
                    {order.buyer?.full_name || 'Не указан'}
                  </div>
                  {order.buyer?.opt_id && (
                    <div className="text-muted-foreground font-mono">
                      {order.buyer.opt_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info Block */}
              {order.text_order && order.text_order.trim() && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">
                    Дополнительная информация
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                    {order.text_order}
                  </p>
                </div>
              )}

              {/* Timestamp Block */}
              <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 text-center">
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
        </div>
      </CardContent>
    </Card>
  );
};
