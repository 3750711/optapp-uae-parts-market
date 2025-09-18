import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  duration?: number;
  error?: string;
}

interface ProductCreationProgressProps {
  steps: ProgressStep[];
  currentStep?: string;
  totalProgress: number;
}

const ProductCreationProgress: React.FC<ProductCreationProgressProps> = ({
  steps,
  currentStep,
  totalProgress
}) => {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStepText = (step: ProgressStep) => {
    let text = step.label;
    if (step.duration) {
      text += ` (${(step.duration / 1000).toFixed(1)}s)`;
    }
    return text;
  };

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Прогресс создания товара</span>
          <span>{Math.round(totalProgress)}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>
      
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center space-x-3 p-2 rounded transition-colors ${
              step.status === 'in-progress' ? 'bg-blue-50 dark:bg-blue-950' :
              step.status === 'completed' ? 'bg-green-50 dark:bg-green-950' :
              step.status === 'error' ? 'bg-red-50 dark:bg-red-950' :
              'bg-muted/50'
            }`}
          >
            {getStepIcon(step)}
            <div className="flex-1">
              <div className="text-sm font-medium">
                {getStepText(step)}
              </div>
              {step.error && (
                <div className="text-xs text-red-600 mt-1">
                  {step.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCreationProgress;