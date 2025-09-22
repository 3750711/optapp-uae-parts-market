import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SimpleTextInputProps {
  label: string;
  value: string;
  originalValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleTextInput: React.FC<SimpleTextInputProps> = ({
  label,
  value,
  originalValue,
  onChange,
  placeholder,
  className = ''
}) => {
  const isChanged = value !== originalValue;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${isChanged ? 'border-primary ring-1 ring-primary/20' : ''}`}
        />
        {isChanged && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded border-l-2 border-muted-foreground/30">
            <span className="font-medium">Было:</span> {originalValue}
          </div>
        )}
      </div>
    </div>
  );
};