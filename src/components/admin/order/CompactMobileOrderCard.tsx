
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
      <CardContent className="p-2">
        {/* Компактный заголовок */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(order.id)}
              className="shrink-0"
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                <Badge variant="outline" className="text-xs shrink-0 font-mono">
                  №{order.order_number}
                </Badge>
              </div>
              
              <div className="text-xs font-medium line-clamp-1 mb-1">
                {order.title || 'Без названия'}
              </div>
            </div>
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

        {/* Статус и дата в одной строке */}
        <div className="flex items-center justify-between mb-2">
          <EnhancedOrderStatusBadge status={order.status} size="sm" />
          <span className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit'
            })}
          </span>
        </div>

        {/* Основная информация */}
        <div className="space-y-2">
          {/* Информация о товаре */}
          {(order.brand || order.model) && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
              {[order.brand, order.model].filter(Boolean).join(' ')}
            </div>
          )}

          {/* Ценовой блок */}
          <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-2">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-muted-foreground mb-1">Цена</div>
                <div className="font-bold text-primary">
                  ${order.price?.toLocaleString() || '0'}
                </div>
              </div>
              
              {order.delivery_price_confirm && order.delivery_price_confirm > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1">Доставка</div>
                  <div className="font-semibold">
                    ${order.delivery_price_confirm.toLocaleString()}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-muted-foreground mb-1">Мест</div>
                <div className="font-semibold">
                  {order.place_number || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Действия */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(order.id)}
              className="flex-1 h-7 text-xs font-medium"
            >
              <Eye className="h-3 w-3 mr-1" />
              Просмотр
            </Button>
            
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Расширяемые детали */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="space-y-2">
              {/* Блок пользователей */}
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

              {/* Дополнительная информация */}
              {order.text_order && order.text_order.trim() && (
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">
                    Дополнительная информация
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                    {order.text_order}
                  </p>
                </div>
              )}

              {/* Временная метка */}
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
