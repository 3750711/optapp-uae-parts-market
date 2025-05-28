
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TouchOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  touched?: boolean;
  error?: string;
  success?: boolean;
}

const TouchOptimizedInput = forwardRef<HTMLInputElement, TouchOptimizedInputProps>(
  ({ className, touched, error, success, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(
          // Мобильная оптимизация
          "min-h-[44px] text-base leading-normal",
          "touch-manipulation select-text",
          "focus:ring-2 focus:ring-offset-1",
          // Состояния валидации
          error && "border-destructive focus:border-destructive focus:ring-destructive/20",
          success && "border-green-500 focus:border-green-500 focus:ring-green-500/20",
          touched && !error && !success && "border-blue-500",
          className
        )}
        {...props}
      />
    );
  }
);

TouchOptimizedInput.displayName = "TouchOptimizedInput";

export default TouchOptimizedInput;
