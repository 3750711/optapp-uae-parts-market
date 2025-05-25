
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Truck, 
  MapPin, 
  XCircle 
} from "lucide-react";

type OrderStatus = Database['public']['Enums']['order_status'];

interface EnhancedOrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const EnhancedOrderStatusBadge: React.FC<EnhancedOrderStatusBadgeProps> = ({ 
  status, 
  className = "" 
}) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'created':
        return {
          label: 'Создан',
          variant: 'warning' as const,
          icon: Clock,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-200'
        };
      case 'seller_confirmed':
        return {
          label: 'Подтвержден продавцом',
          variant: 'info' as const,
          icon: AlertCircle,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'admin_confirmed':
        return {
          label: 'Подтвержден админом',
          variant: 'default' as const,
          icon: CheckCircle,
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200'
        };
      case 'processed':
        return {
          label: 'Зарегистрирован',
          variant: 'success' as const,
          icon: Package,
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'shipped':
        return {
          label: 'Отправлен',
          variant: 'info' as const,
          icon: Truck,
          bgColor: 'bg-cyan-50',
          textColor: 'text-cyan-800',
          borderColor: 'border-cyan-200'
        };
      case 'delivered':
        return {
          label: 'Доставлен',
          variant: 'success' as const,
          icon: MapPin,
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-200'
        };
      case 'cancelled':
        return {
          label: 'Отменен',
          variant: 'destructive' as const,
          icon: XCircle,
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      default:
        return {
          label: 'Неизвестно',
          variant: 'secondary' as const,
          icon: AlertCircle,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      <IconComponent className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
};
