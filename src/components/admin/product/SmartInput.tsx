import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineAISuggestion } from './InlineAISuggestion';

interface SmartInputProps {
  label: string;
  value: string | number;
  originalValue: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'number';
  prefix?: string;
  suffix?: string;
  min?: number;
  step?: string;
  
  // AI features
  aiSuggestion?: string | number;
  aiConfidence?: number;
  onApplyAI?: () => void;
  onRejectAI?: () => void;
  isAIApplied?: boolean;
  
  // Validation
  disabled?: boolean;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  label,
  value,
  originalValue,
  onChange,
  placeholder,
  className = '',
  type = 'text',
  prefix,
  suffix,
  min,
  step,
  
  aiSuggestion,
  aiConfidence,
  onApplyAI,
  onRejectAI,
  isAIApplied = false,
  
  disabled = false
}) => {
  const isChanged = value !== originalValue;
  const hasAISuggestion = aiSuggestion !== undefined && aiSuggestion !== value && !isAIApplied;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      <div className="space-y-2">
        {/* Input Field */}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {prefix}
            </span>
          )}
          
          <Input
            type={type}
            value={value}
            onChange={(e) => {
              const newValue = type === 'number' ? 
                (e.target.value === '' ? 0 : Number(e.target.value)) : 
                e.target.value;
              onChange(newValue);
            }}
            placeholder={placeholder}
            className={`
              ${prefix ? 'pl-8' : ''} 
              ${suffix ? 'pr-12' : ''} 
              ${isChanged ? 'border-primary ring-1 ring-primary/20' : ''}
            `}
            disabled={disabled}
            min={min}
            step={step}
          />
          
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>

        {/* AI Suggestion */}
        {hasAISuggestion && onApplyAI && (
          <InlineAISuggestion
            suggestion={String(aiSuggestion)}
            confidence={aiConfidence}
            onApply={onApplyAI}
            onReject={onRejectAI}
            isApplied={isAIApplied}
          />
        )}
        
        {/* Change Indicator */}
        {isChanged && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded border-l-2 border-muted-foreground/30">
            <span className="font-medium">Было:</span> {prefix}{originalValue}{suffix}
          </div>
        )}
      </div>
    </div>
  );
};