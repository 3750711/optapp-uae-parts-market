
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Archive, ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getProductStatusTranslations } from '@/utils/translations/productStatuses';

interface ProductStatusBadgeProps {
  status: 'active' | 'sold' | 'pending' | 'archived';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true 
}) => {
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: t.statuses.active,
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
          icon: CheckCircle
        };
      case 'sold':
        return {
          label: t.statuses.sold,
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: ShoppingCart
        };
      case 'pending':
        return {
          label: t.statuses.pending,
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Loader2
        };
      case 'archived':
        return {
          label: t.statuses.archived,
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-300',
          icon: Archive
        };
      default:
        return {
          label: t.statuses.unknown || 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600',
          icon: AlertCircle
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1.5 font-medium transition-all`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${status === 'pending' ? 'animate-spin' : ''}`} />}
      {config.label}
    </Badge>
  );
};

export default ProductStatusBadge;
