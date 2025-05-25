
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Link, CheckCircle, Truck, Package } from "lucide-react";
import { Database } from '@/integrations/supabase/types';
import { Checkbox } from "@/components/ui/checkbox";

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

interface OptimizedAdminOrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onConfirm?: (order: Order) => void;
  onRegister?: (order: Order) => void;
  isSelected?: boolean;
  onSelectionChange?: (orderId: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export const OptimizedAdminOrderCard = memo<OptimizedAdminOrderCardProps>(({ 
  order, 
  onEdit, 
  onDelete, 
  onConfirm,
  onRegister,
  isSelected = false,
  onSelectionChange,
  showCheckbox = false
}) => {
  const highlightColor = 
    order.status === 'processed' ? 'bg-[#F2FCE2] border-l-4 border-l-green-500' :
    order.status === 'created' || order.status === 'seller_confirmed' ? 'bg-[#FEF7CD] border-l-4 border-l-yellow-500' :
    order.status === 'admin_confirmed' ? 'bg-[#FED7AA] border-l-4 border-l-orange-500' :
    '';

  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';
  const showRegisterButton = order.status === 'admin_confirmed';

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'cargo_rf': return 'Cargo РФ';
      case 'cargo_kz': return 'Cargo KZ';
      default: return 'Не указан';
    }
  };

  const getPriorityIcon = () => {
    if (order.status === 'created') return <Package className="h-4 w-4 text-red-500" />;
    if (showConfirmButton) return <CheckCircle className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  return (
    <Card className={`h-full ${highlightColor} flex flex-col hover:shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="space-y-3 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange?.(order.id, !!checked)}
                className="mt-1"
              />
            )}
            <div className="flex items-center gap-2">
              {getPriorityIcon()}
              <CardTitle className="text-lg font-bold">№ {order.order_number}</CardTitle>
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow">
        {/* Product Info */}
        <div className="space-y-2 p-3 bg-background/50 rounded-lg">
          <div className="font-semibold text-base">{order.title}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Package className="h-3 w-3" />
            {order.brand} {order.model}
          </div>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Продавец</div>
            <div className="space-y-1">
              <div className="font-medium">{order.seller?.full_name || 'Не указано'}</div>
              {order.seller?.opt_id && (
                <Badge variant="outline" className="font-mono text-xs">
                  {order.seller.opt_id}
                </Badge>
              )}
              {order.seller?.telegram && (
                <a
                  href={`https://t.me/${order.seller.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                >
                  {order.seller.telegram}
                  <Link className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Покупатель</div>
            <div className="space-y-1">
              <div className="font-medium">{order.buyer?.full_name || 'Не указано'}</div>
              {order.buyer?.opt_id && (
                <Badge variant="outline" className="font-mono text-xs">
                  {order.buyer.opt_id}
                </Badge>
              )}
              {order.buyer?.telegram && (
                <a
                  href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                >
                  {order.buyer.telegram}
                  <Link className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Стоимость:</span>
            <span className="text-lg font-bold text-primary">{order.price} $</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Доставка:</span>
            <div className="flex items-center gap-2">
              <Truck className="h-3 w-3" />
              <span>{getDeliveryMethodLabel(order.delivery_method)}</span>
            </div>
          </div>

          {order.delivery_price_confirm && (
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Стоимость доставки:</span>
              <span className="font-semibold text-primary">
                {order.delivery_price_confirm} $
              </span>
            </div>
          )}

          {order.delivery_price_confirm && (
            <div className="flex justify-between items-center font-bold text-base border-t pt-2">
              <span>Итого:</span>
              <span className="text-primary">{Number(order.price) + Number(order.delivery_price_confirm)} $</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-2">
          <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
          <div className="flex items-center gap-1">
            <span>Мест:</span>
            <span className="font-medium">{order.place_number || 1}</span>
          </div>
        </div>
      </CardContent>
      
      <div className="p-4 border-t flex items-center justify-end gap-2">
        {showConfirmButton && onConfirm && (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onConfirm(order)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Подтвердить
          </Button>
        )}
        {showRegisterButton && onRegister && (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onRegister(order)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Зарегистрировать
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(order)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={() => onDelete(order)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.price === nextProps.order.price &&
    prevProps.isSelected === nextProps.isSelected
  );
});

OptimizedAdminOrderCard.displayName = 'OptimizedAdminOrderCard';
