
import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOrderCreationStepsProps {
  currentStep: number;
  steps: Array<{
    number: number;
    title: string;
    description: string;
    completed?: boolean;
  }>;
}

export const MobileOrderCreationSteps: React.FC<MobileOrderCreationStepsProps> = ({
  currentStep,
  steps
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${step.number < currentStep || step.completed 
                  ? 'bg-green-500 text-white' 
                  : step.number === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step.number < currentStep || step.completed ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Шаг {currentStep} из {steps.length}</h2>
          <Badge variant="outline" className="text-xs">
            {Math.round((currentStep / steps.length) * 100)}%
          </Badge>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Current step info */}
        <div className="space-y-2">
          <h3 className="font-medium">{steps[currentStep - 1]?.title}</h3>
          <p className="text-sm text-gray-600">{steps[currentStep - 1]?.description}</p>
        </div>

        {/* Mini steps indicator */}
        <div className="flex space-x-2 mt-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`
                w-3 h-3 rounded-full
                ${step.number < currentStep || step.completed
                  ? 'bg-green-500'
                  : step.number === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }
              `}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
