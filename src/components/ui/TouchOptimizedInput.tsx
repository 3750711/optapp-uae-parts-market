
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
          "w-full modal-input-field",
          "text-base", // Prevent zoom on iOS
          touched && error && "border-red-500 focus:border-red-500",
          touched && success && "border-green-500 focus:border-green-500",
          className
        )}
        {...props}
      />
      {touched && error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TouchOptimizedInput;
