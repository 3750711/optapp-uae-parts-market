import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap } from 'lucide-react';

interface AISearchIndicatorProps {
  isActive?: boolean;
  className?: string;
}

export const AISearchIndicator: React.FC<AISearchIndicatorProps> = ({ 
  isActive = false, 
  className = "" 
}) => {
  return (
    <Badge 
      variant={isActive ? "default" : "secondary"} 
      className={`flex items-center gap-1.5 ${className}`}
    >
      <Brain className="h-3 w-3" />
      {isActive && <Zap className="h-3 w-3 animate-pulse" />}
      ИИ Поиск
    </Badge>
  );
};