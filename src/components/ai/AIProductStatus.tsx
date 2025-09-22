import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProductStatusProps {
  productId: string;
  aiConfidence?: number;
  aiEnrichedAt?: string;
  originalTitle?: string;
  currentTitle: string;
  onTriggerEnrichment?: (productId: string) => void;
  isLoading?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const AIProductStatus: React.FC<AIProductStatusProps> = ({
  productId,
  aiConfidence,
  aiEnrichedAt,
  originalTitle,
  currentTitle,
  onTriggerEnrichment,
  isLoading = false,
  className,
  size = 'sm'
}) => {
  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: <Clock className="h-3 w-3 animate-spin" />,
        text: 'Обработка...',
        variant: 'secondary' as const,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      };
    }

    if (!aiEnrichedAt) {
      return {
        icon: <Sparkles className="h-3 w-3" />,
        text: 'Ожидает AI',
        variant: 'outline' as const,
        color: 'text-gray-600 bg-gray-50 border-gray-200'
      };
    }

    if (aiConfidence && aiConfidence >= 0.9) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: `AI: ${Math.round(aiConfidence * 100)}%`,
        variant: 'default' as const,
        color: 'text-green-700 bg-green-50 border-green-200'
      };
    }

    if (aiConfidence && aiConfidence >= 0.7) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: `AI: ${Math.round(aiConfidence * 100)}%`,
        variant: 'secondary' as const,
        color: 'text-yellow-700 bg-yellow-50 border-yellow-200'
      };
    }

    return {
      icon: <AlertTriangle className="h-3 w-3" />,
      text: aiConfidence ? `AI: ${Math.round(aiConfidence * 100)}%` : 'AI низкая точность',
      variant: 'destructive' as const,
      color: 'text-red-700 bg-red-50 border-red-200'
    };
  };

  const statusInfo = getStatusInfo();
  const hasChanges = originalTitle && originalTitle !== currentTitle;
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant={statusInfo.variant}
        className={cn(
          'flex items-center gap-1 font-medium',
          statusInfo.color,
          sizeClasses[size]
        )}
      >
        {statusInfo.icon}
        {statusInfo.text}
      </Badge>

      {hasChanges && (
        <Badge variant="outline" className={cn('text-purple-600 bg-purple-50 border-purple-200', sizeClasses[size])}>
          Изменен AI
        </Badge>
      )}

      {onTriggerEnrichment && !aiEnrichedAt && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTriggerEnrichment(productId)}
          disabled={isLoading}
          className="h-6 px-2 text-xs hover:bg-purple-50"
        >
          {isLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
        </Button>
      )}

      {aiEnrichedAt && (
        <div className="text-xs text-muted-foreground">
          {new Date(aiEnrichedAt).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
    </div>
  );
};

export default AIProductStatus;