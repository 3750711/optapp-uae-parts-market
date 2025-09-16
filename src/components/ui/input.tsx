
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // Mobile-optimized attributes for number inputs
    const mobileAttrs = type === 'number' ? {
      inputMode: props.inputMode ?? 'decimal' as const,
      step: props.step ?? 'any',
      pattern: props.pattern ?? '[0-9]*[.,]?[0-9]*'
    } : {};

    return (
      <input
        type={type}
        className={cn(
          // expanded input x3  
          "flex h-30 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 items-center",
          className
        )}
        ref={ref}
        {...mobileAttrs}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
