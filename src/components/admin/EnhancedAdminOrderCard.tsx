
import React, { memo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, CheckCircle, Eye } from "lucide-react";
import { Database } from '@/integrations/supabase/types';
import { EnhancedOrderStatusBadge } from './EnhancedOrderStatusBadge';
import { OrderPriorityIndicator } from './OrderPriorityIndicator';
import { CompactOrderInfo } from './CompactOrderInfo';

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
    opt_status: string | null;
  } | null;
};

interface EnhancedAdminOrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onConfirm?: (order: Order) => void;
  onRegister?: (order: Order) => void;
  onViewDetails?: (orderId: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (orderId: string, selected: boolean) => void;
  showCheckbox?: boolean;
  isLoading?: boolean;
}

export const EnhancedAdminOrderCard = memo<EnhancedAdminOrderCardProps>(({ 
  order, 
  onEdit, 
  onDelete, 
  onConfirm,
  onRegister,
  onViewDetails,
  isSelected = false,
  onSelectionChange,
  showCheckbox = false,
  isLoading = false
}) => {
  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';
  const showRegisterButton = order.status === 'admin_confirmed';

  const handleAction = (action: () => void) => {
    if (!isLoading) {
      action();
    }
  };

  return (
    <Card className={`
      group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1
      ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}
      ${isLoading ? 'opacity-60 pointer-events-none' : ''}
    `}>
      {/* Header with order number, status and priority */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange?.(order.id, !!checked)}
                className="mt-1 flex-shrink-0"
                disabled={isLoading}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-primary">
                  № {order.order_number}
                </h3>
                <OrderPriorityIndicator 
                  status={order.status} 
                  createdAt={order.created_at}
                />
              </div>
              <EnhancedOrderStatusBadge status={order.status} />
            </div>
          </div>
          
          {/* Quick view button */}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
            onClick={() => onViewDetails?.(order.id)}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Compact order information */}
        <CompactOrderInfo
          orderNumber={order.order_number}
          title={order.title}
          brand={order.brand}
          model={order.model}
          price={order.price}
          deliveryMethod={order.delivery_method}
          sellerName={order.seller?.full_name}
          buyerName={order.buyer?.full_name}
          sellerOptId={order.seller?.opt_id}
          buyerOptId={order.buyer?.opt_id}
        />

        {/* Additional info if needed */}
        {order.delivery_price_confirm && (
          <div className="flex justify-between items-center text-sm font-bold border-t pt-3">
            <span>Итого с доставкой:</span>
            <span className="text-primary">
              {Number(order.price) + Number(order.delivery_price_confirm)} $
            </span>
          </div>
        )}

        {/* Footer with date and actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('ru-RU')}
          </div>
          
          <div className="flex items-center gap-1">
            {showConfirmButton && onConfirm && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 px-2"
                onClick={() => handleAction(() => onConfirm(order))}
                disabled={isLoading}
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            {showRegisterButton && onRegister && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 px-3"
                onClick={() => handleAction(() => onRegister(order))}
                disabled={isLoading}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Рег.</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleAction(() => onEdit(order))}
              disabled={isLoading}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
              onClick={() => handleAction(() => onDelete(order))}
              disabled={isLoading}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.price === nextProps.order.price &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLoading === nextProps.isLoading
  );
});

EnhancedAdminOrderCard.displayName = 'EnhancedAdminOrderCard';
