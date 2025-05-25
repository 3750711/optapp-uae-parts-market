
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Truck, User, Building } from "lucide-react";

interface CompactOrderInfoProps {
  orderNumber: number;
  title: string;
  brand?: string;
  model?: string;
  price: number;
  deliveryMethod: string;
  sellerName?: string;
  buyerName?: string;
  sellerOptId?: string;
  buyerOptId?: string;
}

export const CompactOrderInfo: React.FC<CompactOrderInfoProps> = ({
  orderNumber,
  title,
  brand,
  model,
  price,
  deliveryMethod,
  sellerName,
  buyerName,
  sellerOptId,
  buyerOptId
}) => {
  const getDeliveryIcon = () => {
    switch (deliveryMethod) {
      case 'self_pickup': return <Building className="h-3 w-3" />;
      case 'cargo_rf': return <Truck className="h-3 w-3" />;
      case 'cargo_kz': return <Truck className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'cargo_rf': return 'Cargo РФ';
      case 'cargo_kz': return 'Cargo KZ';
      default: return 'Не указан';
    }
  };

  return (
    <div className="space-y-3">
      {/* Product Info */}
      <div className="space-y-1">
        <div className="font-semibold text-sm leading-tight line-clamp-2">{title}</div>
        {(brand || model) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>{brand} {model}</span>
          </div>
        )}
      </div>

      {/* Price and Delivery */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-bold text-primary">
          <DollarSign className="h-3.5 w-3.5" />
          <span>{price} $</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {getDeliveryIcon()}
          <span>{getDeliveryLabel(deliveryMethod)}</span>
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Продавец</span>
          </div>
          <div className="font-medium truncate">{sellerName || 'Не указано'}</div>
          {sellerOptId && (
            <Badge variant="outline" className="text-xs px-1 py-0 font-mono">
              {sellerOptId}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Покупатель</span>
          </div>
          <div className="font-medium truncate">{buyerName || 'Не указано'}</div>
          {buyerOptId && (
            <Badge variant="outline" className="text-xs px-1 py-0 font-mono">
              {buyerOptId}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
