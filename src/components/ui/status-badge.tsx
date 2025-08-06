import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'accepted':
      case 'принято':
      case 'confirmed':
      case 'delivered':
        return {
          label: 'Принято',
          variant: 'default' as const,
          className: 'bg-green-500 text-white hover:bg-green-600'
        };
      
      case 'pending':
      case 'в обработке':
      case 'created':
      case 'in_progress':
        return {
          label: 'В обработке',
          variant: 'default' as const,
          className: 'bg-blue-500 text-white hover:bg-blue-600'
        };
      
      case 'rejected':
      case 'отклонено':
      case 'cancelled':
        return {
          label: 'Отклонено',
          variant: 'default' as const,
          className: 'bg-red-500 text-white hover:bg-red-600'
        };
      
      case 'expired':
      case 'истекло':
        return {
          label: 'Истекло',
          variant: 'default' as const,
          className: 'bg-gray-400 text-white hover:bg-gray-500'
        };
      
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
};