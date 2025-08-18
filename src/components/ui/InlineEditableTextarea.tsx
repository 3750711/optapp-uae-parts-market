import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface InlineEditableTextareaProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  textareaClassName?: string;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  emptyText?: string;
}

export const InlineEditableTextarea: React.FC<InlineEditableTextareaProps> = ({
  value,
  onSave,
  placeholder,
  className,
  displayClassName,
  textareaClassName,
  maxLength,
  minRows = 3,
  maxRows = 8,
  emptyText = "Click to add description"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [isEditing, editValue.length]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onSave(editValue.trim());
      setIsEditing(false);
      // Update the displayed value immediately
      setEditValue(editValue.trim());
    } catch (err) {
      setError('Failed to save changes');
      setEditValue(value); // Revert on error
      // Error already handled by onSave rejection
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
    }
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("relative", className)}>
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "text-base bg-background border-primary focus:border-primary resize-none",
            textareaClassName
          )}
          maxLength={maxLength}
          rows={minRows}
          disabled={isLoading}
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className={`${isMobile ? 'h-10 text-sm px-4 touch-target' : 'h-8 text-xs'}`}
            >
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <Check className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
                  Save
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className={`${isMobile ? 'h-10 text-sm px-4 touch-target' : 'h-8 text-xs'}`}
            >
              <X className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
              Cancel
            </Button>
          </div>
          {maxLength && (
            <span className="text-xs text-muted-foreground">
              {editValue.length}/{maxLength}
            </span>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Press Ctrl+Enter to save quickly
        </p>
      </div>
    );
  }

  const displayValue = value?.trim() || emptyText;
  const isEmpty = !value?.trim();

  return (
    <div 
      className={cn(
        "group cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors relative",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <p className={cn(
        "select-none whitespace-pre-wrap leading-relaxed",
        isEmpty && "text-muted-foreground italic",
        displayClassName
      )}>
        {displayValue}
      </p>
      <Edit3 className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2`} />
    </div>
  );
};