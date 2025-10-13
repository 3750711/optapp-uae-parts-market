import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/utils/number';

interface SimpleNumberInputProps {
  label: string;
  value: number;
  originalValue: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  className?: string;
}

export const SimpleNumberInput: React.FC<SimpleNumberInputProps> = ({
  label,
  value,
  originalValue,
  onChange,
  prefix = '',
  suffix = '',
  min = 0,
  className = ''
}) => {
  const [localValue, setLocalValue] = React.useState(value.toString());
  
  // Синхронизация с внешним значением
  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);
  
  const isChanged = value !== originalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= min) {
      onChange(numValue);
    }
  };
  
  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    if (localValue === '' || isNaN(numValue) || numValue < min) {
      onChange(min);
      setLocalValue(min.toString());
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            min={min}
            className={`${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${
              isChanged ? 'border-primary ring-1 ring-primary/20' : ''
            }`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {suffix}
            </span>
          )}
        </div>
        {isChanged && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded border-l-2 border-muted-foreground/30">
            <span className="font-medium">Было:</span> {prefix}{formatPrice(originalValue)}{suffix}
          </div>
        )}
      </div>
    </div>
  );
};