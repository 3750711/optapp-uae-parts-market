import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3, Loader2, RotateCcw } from 'lucide-react';
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
  const [justSaved, setJustSaved] = useState(false);
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
      
      // Show success feedback
      setJustSaved(true);
      setTimeout(() => {
        setIsEditing(false);
        setJustSaved(false);
      }, 500);
    } catch (err) {
      setError('Не удалось сохранить изменения');
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
    setJustSaved(false);
  }, [value]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleSave();
  }, [handleSave]);

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

  const hasChanges = editValue.toString() !== value.toString();

  if (isEditing) {
    return (
      <div className={cn("relative w-full", className)}>
        <div className="space-y-2 w-full">
          {/* Show original value for context with diff highlighting */}
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Текущее: {displayValue()}</span>
            {hasChanges && (
              <span className="text-orange-600 font-medium">→ изменено</span>
            )}
          </div>
          
          {/* Success feedback */}
          {justSaved && (
            <div className="flex items-center gap-1 text-green-600 text-sm animate-fade-in">
              <Check className="h-3 w-3" />
              <span>Сохранено</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type={type === 'price' ? 'number' : type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "min-w-0 flex-1 bg-background border-primary focus:border-primary transition-all duration-200",
                isMobile && "min-w-[250px] text-base",
                !isMobile && "min-w-[200px] max-w-[300px]",
                isLoading && "animate-pulse border-orange-300",
                hasChanges && !isLoading && "border-orange-400 bg-orange-50/30",
                justSaved && "border-green-400 bg-green-50/30",
                inputClassName
              )}
              maxLength={maxLength}
              min={min}
              max={max}
              step={step}
              inputMode={type === 'number' || type === 'price' ? 'numeric' : 'text'}
              disabled={isLoading || justSaved}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isLoading || justSaved}
                className={cn(
                  "h-10 w-10 p-0 touch-target transition-all duration-200",
                  justSaved 
                    ? "text-green-600 bg-green-100 hover:bg-green-100" 
                    : "text-green-600 hover:text-green-700 hover:bg-green-50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading || justSaved}
                className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 touch-target"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Enhanced error display with retry button */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <p className="text-sm text-red-600 flex-1">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="text-xs py-1 px-2 h-auto text-red-600 border-red-300 hover:bg-red-50"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Повторить
              </Button>
            </div>
          </div>
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