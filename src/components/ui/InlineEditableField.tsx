import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { normalizeDecimal } from '@/utils/number';

interface InlineEditableFieldProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  type?: 'text' | 'number' | 'price';
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  prefix?: string;
  suffix?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export const InlineEditableField: React.FC<InlineEditableFieldProps> = ({
  value,
  onSave,
  type = 'text',
  placeholder,
  className,
  displayClassName,
  inputClassName,
  prefix,
  suffix,
  required = false,
  maxLength,
  min,
  max,
  step,
  disabled = false,
  disabledMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Sync editValue with external value changes (but not during editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    if (!editValue.trim() && required) {
      setError('This field is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const valueToSave = type === 'number' || type === 'price' 
        ? normalizeDecimal(editValue)
        : editValue.trim();
      
      await onSave(valueToSave);
      setIsEditing(false);
      // Keep the edited value for immediate display
      setEditValue(valueToSave.toString());
    } catch (err) {
      setError('Failed to save changes');
      setEditValue(value.toString()); // Revert on error
      // Error already handled by onSave rejection
    } finally {
      setIsLoading(false);
    }
  }, [editValue, required, type, onSave, value]);

  const handleCancel = useCallback(() => {
    setEditValue(value.toString());
    setIsEditing(false);
    setError(null);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = () => {
    if (type === 'price') {
      return `${prefix || ''}${value}${suffix || ' $'}`;
    }
    return `${prefix || ''}${value}${suffix || ''}`;
  };

  if (isEditing) {
    return (
      <div className={cn("relative", className)}>
        <div className="space-y-2">
          {/* Show original value for context */}
          <div className="text-xs text-muted-foreground">
            Текущее: {displayValue()}
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type={type === 'price' ? 'number' : type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "text-base bg-background border-primary focus:border-primary",
                inputClassName
              )}
              maxLength={maxLength}
              min={min}
              max={max}
              step={step}
              inputMode={type === 'number' || type === 'price' ? 'numeric' : 'text'}
              disabled={isLoading}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isLoading}
                className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 text-green-600 hover:text-green-700 hover:bg-green-50 touch-target`}
              >
                <Check className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
                className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} p-0 text-red-600 hover:text-red-700 hover:bg-red-50 touch-target`}
              >
                <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        disabled 
          ? "rounded px-2 py-1 -mx-2 -my-1 cursor-not-allowed opacity-60" 
          : "group cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors relative",
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
      title={disabled ? disabledMessage : undefined}
    >
      <span className={cn("select-none", displayClassName)}>
        {displayValue()}
      </span>
      {!disabled && (
        <Edit3 className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute -right-5 top-1/2 -translate-y-1/2`} />
      )}
    </div>
  );
};