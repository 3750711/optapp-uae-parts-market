
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, CheckCircle, Eye, MoreVertical } from "lucide-react";
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

interface MobileOrderCardProps {
  order: Order;
  isSelected: boolean;
  onSelect: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  onQuickAction?: (orderId: string, action: string) => void;
}

export const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  order,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickAction
}) => {
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const distance = touchStart - e.targetTouches[0].clientX;
    
    if (Math.abs(distance) > 10) {
      setIsSwipeActive(true);
      setSwipeDirection(distance > 0 ? 'left' : 'right');
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - show delete action
      handleSwipeAction('delete');
    } else if (isRightSwipe) {
      // Swipe right - show confirm action
      handleSwipeAction('confirm');
    }

    setTimeout(() => {
      setIsSwipeActive(false);
      setSwipeDirection(null);
    }, 200);
  };

  const handleSwipeAction = (action: string) => {
    if (action === 'delete') {
      onDelete(order);
    } else if (action === 'confirm' && onQuickAction) {
      onQuickAction(order.id, 'confirm');
    }
  };

  const totalValue = Number(order.price || 0) + Number(order.delivery_price_confirm || 0);
  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';

  return (
    <Card 
      ref={cardRef}
      className={`
        relative overflow-hidden transition-all duration-200 
        ${isSelected ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : 'hover:shadow-md'}
        ${isSwipeActive ? 'scale-95' : ''}
      `}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe Indicators */}
      {isSwipeActive && (
        <>
          <div className={`absolute left-0 top-0 h-full w-16 bg-green-500 flex items-center justify-center transition-opacity duration-200 ${swipeDirection === 'right' ? 'opacity-80' : 'opacity-20'}`}>
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div className={`absolute right-0 top-0 h-full w-16 bg-red-500 flex items-center justify-center transition-opacity duration-200 ${swipeDirection === 'left' ? 'opacity-80' : 'opacity-20'}`}>
            <Trash2 className="h-6 w-6 text-white" />
          </div>
        </>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(order.id)}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  №{order.order_number}
                </Badge>
                <OrderPriorityIndicator
                  createdAt={order.created_at}
                  status={order.status}
                  totalValue={totalValue}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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

        <div className="space-y-2">
          <div className="font-medium text-sm line-clamp-2">
            {order.title || 'Без названия'}
          </div>
          
          {(order.brand || order.model) && (
            <div className="text-xs text-muted-foreground">
              {[order.brand, order.model].filter(Boolean).join(' ')}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Продавец:</div>
              <div className="font-medium">
                {order.seller?.full_name || 'Не указан'}
              </div>
              {order.seller?.opt_id && (
                <div className="text-xs text-muted-foreground">
                  ID: {order.seller.opt_id}
                </div>
              )}
            </div>
            
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground">Покупатель:</div>
              <div className="font-medium">
                {order.buyer?.full_name || 'Не указан'}
              </div>
              {order.buyer?.opt_id && (
                <div className="text-xs text-muted-foreground">
                  ID: {order.buyer.opt_id}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Цена товара:</div>
              <div className="font-semibold text-primary">
                ${order.price?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground">Доставка:</div>
              <div className="font-semibold">
                ${order.delivery_price_confirm?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground">Мест:</div>
              <div className="font-semibold">
                {order.place_number || 0}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
