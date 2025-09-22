import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProcessingIndicatorProps {
  status: 'processing' | 'completed' | 'failed' | 'pending';
  confidence?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AIProcessingIndicator: React.FC<AIProcessingIndicatorProps> = ({
  status,
  confidence,
  className,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <Clock className="h-3 w-3 animate-spin" />,
          text: 'AI обрабатывает...',
          variant: 'secondary' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: confidence ? `AI: ${Math.round(confidence * 100)}%` : 'AI обработан',
          variant: confidence && confidence >= 0.8 ? 'default' as const : 'secondary' as const,
          className: confidence && confidence >= 0.8 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'AI ошибка',
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      default:
        return {
          icon: <Sparkles className="h-3 w-3" />,
          text: 'Ожидает AI',
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-600 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 font-medium',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
};

export default AIProcessingIndicator;