
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, CheckCircle, Eye, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { OrderImageThumbnail } from '@/components/order/OrderImageThumbnail';

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
  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';

  return (
    <Card className={`
      transition-all duration-200 
      ${isSelected ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : 'hover:shadow-md'}
    `}>
      <CardContent className="p-1.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(order.id)}
              className="shrink-0"
            />
            <Badge variant="outline" className="text-xs font-mono shrink-0 py-0.5">
              №{order.order_number}
            </Badge>
            <EnhancedOrderStatusBadge status={order.status} size="sm" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                <MoreVertical className="h-3 w-3" />
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

        <div className="flex items-start gap-2">
          <OrderImageThumbnail orderId={order.id} className="h-10 w-10" size="thumbnail" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium line-clamp-1">
              {order.title || 'Без названия'}
            </div>
            {(order.brand || order.model) && (
              <div className="text-[11px] text-muted-foreground line-clamp-1">
                {[order.brand, order.model].filter(Boolean).join(' ')}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs bg-muted/30 rounded p-1 flex-wrap gap-x-2 gap-y-1">
             <div>
                <span className="text-muted-foreground">Цена: </span>
                <span className="font-bold text-primary">${order.price?.toLocaleString() || '0'}</span>
            </div>
            {order.delivery_price_confirm && order.delivery_price_confirm > 0 && (
                <div>
                    <span className="text-muted-foreground">Доставка: </span>
                    <span className="font-semibold">${order.delivery_price_confirm.toLocaleString()}</span>
                </div>
            )}
            <div>
                <span className="text-muted-foreground">Мест: </span>
                <span className="font-semibold">{order.place_number || 0}</span>
            </div>
        </div>

        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails(order.id)}
            className="flex-1 h-6 text-[11px] font-medium px-1.5"
          >
            <Eye className="h-3 w-3 mr-1" />
            Просмотр
          </Button>
          
          {showConfirmButton && onQuickAction && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onQuickAction(order.id, 'confirm')}
              className="h-6 px-1.5 text-[11px] bg-green-600 hover:bg-green-700 text-white shrink-0"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Подтвердить
            </Button>
          )}
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
               <div className="pt-1.5 space-y-1.5">
                 <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 rounded-lg p-2">
                    <div>
                      <div className="text-muted-foreground mb-1 font-medium">Продавец</div>
                      <div className="font-medium truncate">
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
                      <div className="font-medium truncate">
                        {order.buyer?.full_name || 'Не указан'}
                      </div>
                      {order.buyer?.opt_id && (
                        <div className="text-muted-foreground font-mono">
                          {order.buyer.opt_id}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};
