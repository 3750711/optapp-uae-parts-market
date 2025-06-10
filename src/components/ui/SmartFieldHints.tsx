
import React from 'react';
import { Info } from 'lucide-react';

interface Suggestion {
  type: 'tip' | 'warning' | 'error';
  text: string;
}

interface SmartFieldHintsProps {
  fieldName: string;
  value: string;
  suggestions: Suggestion[];
}

const SmartFieldHints: React.FC<SmartFieldHintsProps> = ({
  fieldName,
  value,
  suggestions
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`flex items-start gap-2 text-sm p-2 rounded ${
            suggestion.type === 'tip'
              ? 'bg-blue-50 text-blue-700'
              : suggestion.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{suggestion.text}</span>
        </div>
      ))}
    </div>
  );
};

export default SmartFieldHints;
