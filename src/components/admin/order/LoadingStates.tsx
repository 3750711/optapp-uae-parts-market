
import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  onClick,
  variant = "default",
  size = "default",
  disabled,
  className
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
    >
      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {children}
    </Button>
  );
};

interface ActionStateIndicatorProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  successMessage?: string;
  errorMessage?: string;
  className?: string;
}

export const ActionStateIndicator: React.FC<ActionStateIndicatorProps> = ({
  state,
  successMessage = 'Выполнено',
  errorMessage = 'Ошибка',
  className = ''
}) => {
  if (state === 'idle') return null;

  const stateConfig = {
    loading: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: 'Загрузка...',
      variant: 'secondary' as const,
      bgColor: 'bg-blue-50'
    },
    success: {
      icon: <CheckCircle className="h-4 w-4" />,
      text: successMessage,
      variant: 'secondary' as const,
      bgColor: 'bg-green-50 text-green-700'
    },
    error: {
      icon: <AlertCircle className="h-4 w-4" />,
      text: errorMessage,
      variant: 'destructive' as const,
      bgColor: 'bg-red-50 text-red-700'
    }
  };

  const config = stateConfig[state];

  return (
    <Badge 
      variant={config.variant} 
      className={`inline-flex items-center gap-2 ${config.bgColor} ${className}`}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
};

interface BulkActionLoadingProps {
  isLoading: boolean;
  selectedCount: number;
  action: string;
}

export const BulkActionLoading: React.FC<BulkActionLoadingProps> = ({
  isLoading,
  selectedCount,
  action
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div>
            <div className="font-medium">Выполняется {action}</div>
            <div className="text-sm text-muted-foreground">
              Обрабатывается {selectedCount} заказов...
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  );
};

export const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="w-20 h-6 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-3">
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
        <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
        
        <div className="flex justify-between">
          <div className="space-y-1">
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
