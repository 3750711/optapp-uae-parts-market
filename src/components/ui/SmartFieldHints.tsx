
import React from 'react';
import { Lightbulb, TrendingUp, Users, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Suggestion {
  type: 'tip' | 'trend' | 'popular' | 'autocomplete';
  text: string;
  action?: () => void;
}

interface SmartFieldHintsProps {
  fieldName: string;
  value: string;
  suggestions: Suggestion[];
  className?: string;
}

const SmartFieldHints: React.FC<SmartFieldHintsProps> = ({ 
  fieldName, 
  value, 
  suggestions, 
  className 
}) => {
  if (suggestions.length === 0) return null;

  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'tip': return <Lightbulb className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'popular': return <Users className="h-4 w-4" />;
      case 'autocomplete': return <Package className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <Alert key={index} className="py-2">
          <div className="flex items-center gap-2">
            {getIcon(suggestion.type)}
            <AlertDescription className="flex-1">
              {suggestion.text}
            </AlertDescription>
            {suggestion.action && (
              <button
                type="button"
                onClick={suggestion.action}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Применить
              </button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default SmartFieldHints;
