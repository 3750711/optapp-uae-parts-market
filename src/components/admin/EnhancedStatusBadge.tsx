
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Ban, AlertCircle, User, Shield } from 'lucide-react';

interface EnhancedStatusBadgeProps {
  type: 'verification' | 'userType' | 'optStatus';
  value: string;
  size?: 'sm' | 'md';
}

export const EnhancedStatusBadge: React.FC<EnhancedStatusBadgeProps> = ({ 
  type, 
  value, 
  size = 'md' 
}) => {
  const getVerificationConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
          label: 'Подтвержден'
        };
      case 'blocked':
        return {
          icon: Ban,
          className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
          label: 'Заблокирован'
        };
      case 'pending':
        return {
          icon: Clock,
          className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
          label: 'Ожидает'
        };
      default:
        return {
          icon: AlertCircle,
          className: 'bg-gray-100 text-gray-700 border-gray-200',
          label: status
        };
    }
  };

  const getUserTypeConfig = (userType: string) => {
    switch (userType) {
      case 'admin':
        return {
          icon: Shield,
          className: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
          label: 'Админ'
        };
      case 'seller':
        return {
          icon: User,
          className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
          label: 'Продавец'
        };
      default:
        return {
          icon: User,
          className: 'bg-gray-100 text-gray-700 border-gray-200',
          label: 'Покупатель'
        };
    }
  };

  const getOptStatusConfig = (optStatus: string) => {
    switch (optStatus) {
      case 'opt_user':
        return {
          icon: CheckCircle,
          className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
          label: 'OPT'
        };
      default:
        return {
          icon: User,
          className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
          label: 'Бесплатный'
        };
    }
  };

  let config;
  if (type === 'verification') {
    config = getVerificationConfig(value);
  } else if (type === 'userType') {
    config = getUserTypeConfig(value);
  } else {
    config = getOptStatusConfig(value);
  }

  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm'} font-medium transition-colors duration-200 flex items-center gap-1`}
    >
      <Icon size={iconSize} />
      {config.label}
    </Badge>
  );
};
