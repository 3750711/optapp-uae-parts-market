
import React from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface OrderPriorityIndicatorProps {
  createdAt: string;
  status: string;
  totalValue?: number;
}

export const OrderPriorityIndicator: React.FC<OrderPriorityIndicatorProps> = ({ 
  createdAt, 
  status,
  totalValue = 0 
}) => {
  const getPriority = () => {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Высокий приоритет: заказы старше 3 дней без движения или дорогие заказы
    if ((daysDiff > 3 && ['created', 'seller_confirmed'].includes(status)) || totalValue > 1000) {
      return {
        level: 'high',
        color: 'bg-red-500',
        icon: AlertTriangle,
        label: 'Высокий приоритет'
      };
    }
    
    // Средний приоритет: заказы старше 1 дня
    if (daysDiff > 1 && !['delivered', 'cancelled'].includes(status)) {
      return {
        level: 'medium',
        color: 'bg-yellow-500',
        icon: Clock,
        label: 'Средний приоритет'
      };
    }
    
    // Низкий приоритет: новые заказы или в процессе
    if (['processed', 'shipped'].includes(status)) {
      return {
        level: 'low',
        color: 'bg-green-500',
        icon: Zap,
        label: 'В работе'
      };
    }
    
    return null;
  };

  const priority = getPriority();
  
  if (!priority) return null;

  const Icon = priority.icon;

  return (
    <div className="flex items-center gap-1" title={priority.label}>
      <div className={`w-2 h-2 rounded-full ${priority.color} animate-pulse`} />
      <Icon className="h-3 w-3 text-muted-foreground" />
    </div>
  );
};
