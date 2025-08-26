
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Database } from '@/integrations/supabase/types';
import { CheckCircle, Clock, Package, Truck, ShoppingCart, XCircle, AlertCircle } from 'lucide-react';

type OrderStatus = Database['public']['Enums']['order_status'];

interface EnhancedOrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  compact?: boolean;
}

export const EnhancedOrderStatusBadge: React.FC<EnhancedOrderStatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true,
  compact = false
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'created':
        return {
          label: 'Создан',
          compactLabel: 'Создан',
          className: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200',
          icon: Clock
        };
      case 'seller_confirmed':
        return {
          label: 'Подтвержден продавцом',
          compactLabel: 'Продавец ✓',
          className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
          icon: CheckCircle
        };
      case 'admin_confirmed':
        return {
          label: 'Подтвержден администратором',
          compactLabel: 'Админ ✓',
          className: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
          icon: AlertCircle
        };
      case 'processed':
        return {
          label: 'Зарегистрирован',
          compactLabel: 'Регистр.',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
          icon: Package
        };
      case 'shipped':
        return {
          label: 'Отправлен',
          compactLabel: 'Отправлен',
          className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
          icon: Truck
        };
      case 'delivered':
        return {
          label: 'Доставлен',
          compactLabel: 'Доставлен',
          className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
          icon: ShoppingCart
        };
      case 'cancelled':
        return {
          label: 'Отменен',
          compactLabel: 'Отменен',
          className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
          icon: XCircle
        };
      default:
        return {
          label: status,
          compactLabel: status,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: Clock
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const displayLabel = compact ? config.compactLabel : config.label;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 max-w-[120px]',
    md: 'text-sm px-3 py-1.5 max-w-[150px]',
    lg: 'text-base px-4 py-2 max-w-[200px]'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1 font-medium transition-all duration-200 border truncate`}
      title={config.label}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span className="truncate">{displayLabel}</span>
    </Badge>
  );
};
