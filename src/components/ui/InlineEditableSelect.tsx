import React, { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditableSelectProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export const InlineEditableSelect: React.FC<InlineEditableSelectProps> = ({
  value,
  onSave,
  options,
  placeholder,
  className,
  displayClassName,
  disabled = false,
  disabledMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save changes');
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
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const getDisplayLabel = (val: string) => {
    const option = options.find(opt => opt.value === val);
    return option?.label || val;
  };

  if (isEditing) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex items-center gap-2">
          <Select 
            value={editValue} 
            onValueChange={setEditValue}
            disabled={isLoading}
          >
            <SelectTrigger className="text-base bg-background border-primary focus:border-primary">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
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
        {getDisplayLabel(value)}
      </span>
      {!disabled && (
        <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute -right-5 top-1/2 -translate-y-1/2" />
      )}
    </div>
  );
};