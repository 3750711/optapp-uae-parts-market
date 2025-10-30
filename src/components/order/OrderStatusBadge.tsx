
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case 'created':
        return 'bg-gray-100 text-gray-800';
      case 'seller_confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'admin_confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'processed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    // Сокращенные названия для минимальной ширины столбцов
    switch (status) {
      case 'created':
        return 'Созд.';
      case 'seller_confirmed':
        return 'Прод.';
      case 'admin_confirmed':
        return 'Адм.';
      case 'processed':
        return 'Зарег.';
      case 'shipped':
        return 'Отпр.';
      case 'delivered':
        return 'Дост.';
      case 'cancelled':
        return 'Отм.';
      default:
        return status;
    }
  };

  return (
    <Badge className={getStatusBadgeColor(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
};
