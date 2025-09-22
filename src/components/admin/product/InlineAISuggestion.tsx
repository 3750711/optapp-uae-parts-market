import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Check, X } from 'lucide-react';

interface InlineAISuggestionProps {
  suggestion: string;
  confidence?: number;
  onApply: () => void;
  onReject?: () => void;
  className?: string;
  isApplied?: boolean;
}

export const InlineAISuggestion: React.FC<InlineAISuggestionProps> = ({
  suggestion,
  confidence,
  onApply,
  onReject,
  className = '',
  isApplied = false
}) => {
  const confidencePercent = confidence ? Math.round(confidence * 100) : 0;
  const confidenceColor = confidence ? 
    (confidence >= 0.9 ? 'text-green-600' : 
     confidence >= 0.7 ? 'text-yellow-600' : 'text-red-600') : 'text-muted-foreground';

  if (isApplied) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-green-50 rounded-lg border-l-4 border-green-400 ${className}`}>
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700">AI предложение применено</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400 ${className}`}>
      <Bot className="h-4 w-4 text-blue-600" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-blue-900 truncate" title={suggestion}>
          AI: {suggestion}
        </div>
        {confidence && (
          <div className={`text-xs ${confidenceColor}`}>
            Уверенность: {confidencePercent}%
          </div>
        )}
      </div>
      
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant="outline"
          className="h-7 px-2 text-xs bg-white hover:bg-blue-100"
          onClick={onApply}
        >
          Применить
        </Button>
        {onReject && (
          <Button 
            size="sm" 
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-red-100"
            onClick={onReject}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};