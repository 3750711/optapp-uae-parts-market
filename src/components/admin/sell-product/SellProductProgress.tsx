
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight, Package, Users, FileCheck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SellProductProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  canNavigateBack?: boolean;
}

const SellProductProgress: React.FC<SellProductProgressProps> = ({
  currentStep,
  onStepClick,
  canNavigateBack = false
}) => {
  const isMobile = useIsMobile();
  const steps = [
    {
      number: 1,
      title: "Выбор товара",
      icon: Package,
      description: "Выберите товар для продажи"
    },
    {
      number: 2,
      title: "Выбор покупателя",
      icon: Users,
      description: "Выберите покупателя"
    },
    {
      number: 3,
      title: "Подтверждение заказа",
      icon: FileCheck,
      description: "Проверьте и подтвердите детали заказа"
    }
  ];

  const handleStepClick = (stepNumber: number) => {
    if (canNavigateBack && onStepClick && stepNumber < currentStep) {
      onStepClick(stepNumber);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className={isMobile ? "p-3" : "p-4"}>
        <div className={isMobile ? "flex items-center justify-center space-x-2" : "flex items-center justify-between"}>
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isClickable = canNavigateBack && step.number < currentStep;
            const StepIcon = step.icon;

            if (isMobile) {
              // Mobile: show only step numbers/icons horizontally
              return (
                <div key={step.number} className="flex items-center">
                  <Button
                    variant={isClickable ? "outline" : "ghost"}
                    size="sm"
                    className={`
                      w-8 h-8 rounded-full p-0 transition-all duration-200
                      ${isCompleted ? 'bg-green-100 text-green-600 border-green-300' : ''}
                      ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                      ${isClickable ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'}
                      ${!isCompleted && !isCurrent ? 'bg-gray-100 text-gray-400' : ''}
                    `}
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isCurrent ? (
                      <StepIcon className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </Button>
                  {index < steps.length - 1 && (
                    <ArrowRight className={`
                      w-3 h-3 mx-1
                      ${currentStep > step.number ? 'text-green-600' : 'text-gray-300'}
                    `} />
                  )}
                </div>
              );
            }

            // Desktop: show full layout
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <Button
                    variant={isClickable ? "outline" : "ghost"}
                    size="sm"
                    className={`
                      w-12 h-12 rounded-full p-0 mb-2 transition-all duration-200
                      ${isCompleted ? 'bg-green-100 text-green-600 border-green-300' : ''}
                      ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                      ${isClickable ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'}
                      ${!isCompleted && !isCurrent ? 'bg-gray-100 text-gray-400' : ''}
                    `}
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : isCurrent ? (
                      <StepIcon className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </Button>
                  <div className="text-center">
                    <div className={`
                      text-sm font-medium mb-1
                      ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}
                    `}>
                      {step.title}
                    </div>
                    <div className={`
                      text-xs
                      ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}
                    `}>
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="flex items-center px-4">
                    <ArrowRight className={`
                      w-5 h-5
                      ${currentStep > step.number ? 'text-green-600' : 'text-gray-300'}
                    `} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Mobile: show current step name below */}
        {isMobile && (
          <div className="text-center mt-2">
            <div className="text-sm font-medium text-gray-900">
              {steps.find(s => s.number === currentStep)?.title}
            </div>
          </div>
        )}
        
        {canNavigateBack && currentStep > 1 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Вы можете вернуться к предыдущим шагам, нажав на них
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SellProductProgress;
