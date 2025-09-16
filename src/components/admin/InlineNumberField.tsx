import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeDecimal } from '@/utils/number';

interface InlineNumberFieldProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  className?: string;
  displayClassName?: string;
  disabled?: boolean;
}

export function InlineNumberField({
  value,
  onSave,
  min = 0,
  max = 999999,
  step = 1,
  prefix,
  suffix,
  label,
  className = '',
  displayClassName = '',
  disabled = false
}: InlineNumberFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
      setError(null);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleIncrement = () => {
    const newValue = Math.min(editValue + step, max);
    setEditValue(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(editValue - step, min);
    setEditValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const normalized = normalizeDecimal(input);
    const clamped = Math.min(Math.max(normalized, min), max);
    setEditValue(clamped);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(editValue);
      setJustSaved(true);
      
      setTimeout(() => {
        setIsEditing(false);
        setJustSaved(false);
      }, 500);
    } catch (err: any) {
      setError('Не удалось сохранить изменения');
      setEditValue(value); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const displayValue = () => {
    return `${prefix || ''}${value}${suffix || ''}`;
  };

  const hasChanges = editValue !== value;

  if (!isEditing) {
    return (
      <div 
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-2 transition-colors min-h-[40px]",
          disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
          className
        )}
        onClick={() => !disabled && setIsEditing(true)}
      >
        {label && <span className="text-sm text-muted-foreground">{label}:</span>}
        <span className={cn("font-medium text-sm", displayClassName)}>
          {displayValue()}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1 flex-wrap", className)}>
      {label && <span className="text-sm text-muted-foreground mr-2">{label}:</span>}
      
      {/* Success/Error feedback */}
      {justSaved && (
        <div className="text-xs text-green-600 font-medium mr-2">
          Сохранено ✓
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 mr-2">
          {error}
        </div>
      )}
      
      <div className="flex items-center gap-1">
        {/* Decrement button */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 shrink-0"
          onClick={handleDecrement}
          disabled={editValue <= min || isLoading || justSaved}
        >
          <Minus className="h-4 w-4" />
        </Button>

        {/* Input field */}
        <div className="relative">
          {prefix && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {prefix}
            </span>
          )}
          <Input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-8 w-20 text-center transition-all duration-200",
              prefix && "pl-6",
              suffix && "pr-8",
              isLoading && "animate-pulse border-orange-300",
              hasChanges && !isLoading && "border-orange-400 bg-orange-50/30",
              justSaved && "border-green-400 bg-green-50/30",
              error && "border-red-400 bg-red-50/30"
            )}
            min={min}
            max={max}
            step={step}
            disabled={isLoading || justSaved}
          />
          {suffix && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        {/* Increment button */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 shrink-0"
          onClick={handleIncrement}
          disabled={editValue >= max || isLoading || justSaved}
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Action buttons */}
        <div className="flex gap-1 ml-1">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 shrink-0 transition-all duration-200",
              justSaved 
                ? "text-green-600 bg-green-100 hover:bg-green-100" 
                : "text-green-600 hover:text-green-700 hover:bg-green-50"
            )}
            onClick={handleSave}
            disabled={isLoading || justSaved || !hasChanges}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleCancel}
            disabled={isLoading || justSaved}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}