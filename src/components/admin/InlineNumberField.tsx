import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Check, X, Loader2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeDecimal } from '@/utils/number';
import { useIsMobileEnhanced } from '@/hooks/use-mobile-enhanced';

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
  compact?: boolean; // Force mobile mode
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
  disabled = false,
  compact = false
}: InlineNumberFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobileEnhanced() || compact;

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
    const formattedValue = step < 1 ? value.toFixed(2) : value.toString();
    return `${prefix || ''}${formattedValue}${suffix || ''}`;
  };

  const hasChanges = editValue !== value;

  // View mode
  if (!isEditing) {
    return (
      <button
        onClick={() => !disabled && setIsEditing(true)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1 sm:gap-2",
          "px-2 py-1 rounded-md",
          "hover:bg-accent/50 transition-colors",
          "text-sm sm:text-base",
          "max-w-full min-h-[40px]",
          disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
          className
        )}
      >
        {label && (
          <span className="text-xs sm:text-sm text-muted-foreground truncate">
            {label}:
          </span>
        )}
        <span className={cn("font-medium whitespace-nowrap", displayClassName)}>
          {displayValue()}
        </span>
        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground ml-1" />
      </button>
    );
  }

  // Mobile editing mode (vertical layout)
  if (isMobile) {
    return (
      <div className={cn(
        "flex flex-col gap-2 p-2 bg-card rounded-lg border",
        "max-w-full",
        className
      )}>
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}

        {/* Success/Error feedback */}
        {justSaved && (
          <div className="text-xs text-green-600 font-medium">
            Сохранено ✓
          </div>
        )}
        {error && (
          <div className="text-xs text-destructive">
            {error}
          </div>
        )}
        
        {/* Input field with prefix/suffix */}
        <div className="relative">
          {prefix && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground z-10">
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
              "h-12 text-center text-lg font-medium",
              "transition-all duration-200",
              prefix && "pl-8",
              suffix && "pr-12",
              isLoading && "animate-pulse border-orange-300",
              hasChanges && !isLoading && "border-orange-400 bg-orange-50/30 dark:bg-orange-950/30",
              justSaved && "border-green-400 bg-green-50/30 dark:bg-green-950/30",
              error && "border-destructive bg-destructive/10"
            )}
            min={min}
            max={max}
            step={step}
            disabled={isLoading || justSaved}
            inputMode="decimal"
          />
          {suffix && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>

        {/* +/- buttons in row */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={handleDecrement}
            disabled={editValue <= min || isLoading || justSaved}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={handleIncrement}
            disabled={editValue >= max || isLoading || justSaved}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1 h-11"
            onClick={handleSave}
            disabled={isLoading || justSaved || !hasChanges}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Сохранить
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={handleCancel}
            disabled={isLoading || justSaved}
          >
            <X className="h-4 w-4 mr-1" />
            Отмена
          </Button>
        </div>
      </div>
    );
  }

  // Desktop editing mode (horizontal layout)
  return (
    <div className={cn(
      "inline-flex items-center gap-1 lg:gap-2 flex-wrap",
      "p-1 bg-card rounded-lg border",
      "max-w-full",
      className
    )}>
      {label && (
        <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
          {label}:
        </span>
      )}

      {/* Success/Error feedback */}
      {justSaved && (
        <div className="text-xs text-green-600 font-medium mr-2">
          Сохранено ✓
        </div>
      )}
      {error && (
        <div className="text-xs text-destructive mr-2">
          {error}
        </div>
      )}
      
      {/* Decrement button */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 lg:h-9 lg:w-9 p-0 shrink-0"
        onClick={handleDecrement}
        disabled={editValue <= min || isLoading || justSaved}
      >
        <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
      </Button>

      {/* Input field */}
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs lg:text-sm text-muted-foreground pointer-events-none">
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
            "h-8 lg:h-9",
            "w-16 sm:w-20 lg:w-24",
            "text-center text-sm lg:text-base",
            "transition-all duration-200",
            prefix && "pl-6 lg:pl-8",
            suffix && "pr-8 lg:pr-10",
            isLoading && "animate-pulse border-orange-300",
            hasChanges && !isLoading && "border-orange-400 bg-orange-50/30 dark:bg-orange-950/30",
            justSaved && "border-green-400 bg-green-50/30 dark:bg-green-950/30",
            error && "border-destructive bg-destructive/10"
          )}
          min={min}
          max={max}
          step={step}
          disabled={isLoading || justSaved}
          inputMode="decimal"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs lg:text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>

      {/* Increment button */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 lg:h-9 lg:w-9 p-0 shrink-0"
        onClick={handleIncrement}
        disabled={editValue >= max || isLoading || justSaved}
      >
        <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
      </Button>

      {/* Action buttons */}
      <div className="flex gap-1 ml-1 lg:ml-2 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 w-8 lg:h-9 lg:w-9 p-0 transition-all duration-200",
            justSaved 
              ? "text-green-600 bg-green-100 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-950" 
              : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
          )}
          onClick={handleSave}
          disabled={isLoading || justSaved || !hasChanges}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 animate-spin" />
          ) : (
            <Check className="h-3 w-3 lg:h-4 lg:w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 lg:h-9 lg:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleCancel}
          disabled={isLoading || justSaved}
        >
          <X className="h-3 w-3 lg:h-4 lg:w-4" />
        </Button>
      </div>
    </div>
  );
}