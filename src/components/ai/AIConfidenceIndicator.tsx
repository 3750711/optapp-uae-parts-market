import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles } from 'lucide-react';
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
    return null;
  }

  const confidencePercent = Math.round(confidence * 100);
  
  return (
    <Badge 
      variant="secondary"
      className={cn("gap-1 text-xs", className)}
    >
      <Bot className="h-3 w-3" />
      AI: {confidencePercent}%
    </Badge>
  );
};