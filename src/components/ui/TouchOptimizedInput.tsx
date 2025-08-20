
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TouchOptimizedInputProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  touched?: boolean;
  error?: string | null;
  success?: boolean;
  type?: string;
  className?: string;
  min?: string;
  max?: string;
  step?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  disabled?: boolean;
}

const TouchOptimizedInput: React.FC<TouchOptimizedInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  touched = false,
  error = null,
  success = false,
  type = "text",
  className,
  min,
  max,
  step,
  inputMode,
  disabled = false,
  ...props
}) => {
  return (
    <div className="w-full">
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        inputMode={inputMode || (type === "number" ? "numeric" : "text")}
        disabled={disabled}
        className={cn(
          "w-full modal-input-field touch-optimized-input",
          "text-base leading-normal", // Prevent zoom on iOS
          "min-h-[44px] px-3 py-2", // Touch target size
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          touched && error && [
            "border-destructive focus:border-destructive",
            "focus:ring-destructive/20"
          ],
          touched && success && [
            "border-success focus:border-success", 
            "focus:ring-success/20"
          ],
          className
        )}
        autoComplete={type === "number" ? "off" : undefined}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        {...props}
      />
      {touched && error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TouchOptimizedInput;
