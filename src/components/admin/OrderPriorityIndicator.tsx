
import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderPriorityIndicatorProps {
  status: OrderStatus;
  createdAt: string;
  className?: string;
}

export const OrderPriorityIndicator: React.FC<OrderPriorityIndicatorProps> = ({
  status,
  createdAt,
  className = ""
}) => {
  const getPriority = () => {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (status === 'created' && daysSinceCreated > 2) {
      return {
        level: 'urgent',
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        label: 'Срочно'
      };
    }

    if ((status === 'created' || status === 'seller_confirmed') && daysSinceCreated > 1) {
      return {
        level: 'high',
        icon: Clock,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100',
        label: 'Высокий'
      };
    }

    if (status === 'processed' || status === 'shipped' || status === 'delivered') {
      return {
        level: 'normal',
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        label: 'Обработан'
      };
    }

    return null;
  };

  const priority = getPriority();
  
  if (!priority) return null;

  const IconComponent = priority.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${priority.bgColor} ${className}`}>
      <IconComponent className={`h-3 w-3 ${priority.color}`} />
      <span className={`text-xs font-medium ${priority.color}`}>
        {priority.label}
      </span>
    </div>
  );
};
