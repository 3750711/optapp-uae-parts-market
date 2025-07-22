
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, XCircle, CheckCircle, AlertTriangle, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfferStatusBadgeProps {
  status: string;
  className?: string;
}

export const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({
  status,
  className
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Активное',
          icon: Clock,
          variant: 'default' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'cancelled':
        return {
          label: 'Отменено',
          icon: XCircle,
          variant: 'secondary' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        };
      case 'expired':
        return {
          label: 'Истекло',
          icon: AlertTriangle,
          variant: 'outline' as const,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        };
      case 'rejected':
        return {
          label: 'Отклонено',
          icon: ThumbsDown,
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'accepted':
        return {
          label: 'Принято',
          icon: CheckCircle,
          variant: 'default' as const,
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      default:
        return {
          label: 'Неизвестно',
          icon: Clock,
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
