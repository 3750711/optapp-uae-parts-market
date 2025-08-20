import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'current' | 'completed';
}

interface StepperProps {
  steps: Step[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, className }) => {
  return (
    <nav className={cn("flex items-center justify-center", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
                step.status === 'completed' && "bg-green-600 border-green-600 text-white",
                step.status === 'current' && "bg-primary border-primary text-primary-foreground",
                step.status === 'pending' && "bg-background border-muted-foreground text-muted-foreground"
              )}
            >
              {step.status === 'completed' ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-xs font-medium",
                  step.status === 'current' && "text-primary",
                  step.status === 'completed' && "text-green-600",
                  step.status === 'pending' && "text-muted-foreground"
                )}
              >
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </div>
              )}
            </div>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-16 h-0.5 mx-4 mb-6",
                step.status === 'completed' ? "bg-green-600" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </nav>
  );
};