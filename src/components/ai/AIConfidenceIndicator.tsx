import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIConfidenceIndicatorProps {
  confidence?: number;
  enrichedAt?: string;
  isProcessing?: boolean;
  className?: string;
}

export const AIConfidenceIndicator: React.FC<AIConfidenceIndicatorProps> = ({
  confidence,
  enrichedAt,
  isProcessing = false,
  className
}) => {
  if (isProcessing) {
    return (
      <Badge 
        variant="outline" 
        className={cn("gap-1 text-xs animate-pulse", className)}
      >
        <Sparkles className="h-3 w-3 animate-spin" />
        AI обработка...
      </Badge>
    );
  }

  if (!confidence || !enrichedAt) {
    return (
      <Badge 
        variant="outline" 
        className={cn("gap-1 text-xs opacity-50", className)}
      >
        <Bot className="h-3 w-3" />
        Не обработано
      </Badge>
    );
  }

  const confidencePercent = Math.round(confidence * 100);
  
  // Определяем уровень уверенности и соответствующие стили
  const getConfidenceLevel = () => {
    if (confidence >= 0.9) {
      return {
        level: 'high',
        icon: CheckCircle,
        variant: 'default' as const,
        bgClass: 'bg-green-500/10 text-green-700 border-green-200',
        label: 'Высокая точность',
        description: 'AI высоко уверен в результате'
      };
    } else if (confidence >= 0.7) {
      return {
        level: 'medium',
        icon: AlertTriangle,
        variant: 'secondary' as const,
        bgClass: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
        label: 'Средняя точность',
        description: 'Рекомендуется проверка'
      };
    } else {
      return {
        level: 'low',
        icon: AlertCircle,
        variant: 'destructive' as const,
        bgClass: 'bg-red-500/10 text-red-700 border-red-200',
        label: 'Низкая точность',
        description: 'Требуется ручная проверка'
      };
    }
  };

  const confidenceLevel = getConfidenceLevel();
  const Icon = confidenceLevel.icon;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Badge 
        variant={confidenceLevel.variant}
        className={cn("gap-1 text-xs", confidenceLevel.bgClass)}
      >
        <Icon className="h-3 w-3" />
        AI {confidencePercent}%
      </Badge>
      
      <div className="text-xs text-muted-foreground">
        {confidenceLevel.label}
      </div>
      
      {/* Progress bar для визуального отображения confidence */}
      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            confidence >= 0.9 ? "bg-green-500" :
            confidence >= 0.7 ? "bg-yellow-500" : "bg-red-500"
          )}
          style={{ width: `${confidencePercent}%` }}
        />
      </div>
    </div>
  );
};