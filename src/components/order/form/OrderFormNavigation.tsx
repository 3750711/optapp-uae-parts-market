
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  isMobile?: boolean;
}

const OrderFormNavigation: React.FC<OrderFormNavigationProps> = ({
  currentStep,
  totalSteps,
  onStepChange,
  isMobile = false
}) => {
  if (!isMobile) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStepChange(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="min-h-[44px] px-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        
        <div className="flex space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                step === currentStep ? 'bg-primary' : 
                step < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStepChange(Math.min(totalSteps, currentStep + 1))}
          disabled={currentStep === totalSteps}
          className="min-h-[44px] px-6"
        >
          Далее
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default OrderFormNavigation;
