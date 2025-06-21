
import React from 'react';
import { ChevronRight, Package, UserCheck, ShoppingCart } from 'lucide-react';

interface SellProductProgressProps {
  currentStep: number;
}

const SellProductProgress: React.FC<SellProductProgressProps> = ({ currentStep }) => {
  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return <Package className="h-4 w-4" />;
      case 2: return <UserCheck className="h-4 w-4" />;
      case 3: return <ShoppingCart className="h-4 w-4" />;
      default: return null;
    }
  };

  const steps = [
    { num: 1, title: "Товар", completed: currentStep > 1 },
    { num: 2, title: "Покупатель", completed: currentStep > 2 },
    { num: 3, title: "Создание", completed: false }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4">
        {steps.map((stepItem, index) => (
          <React.Fragment key={stepItem.num}>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep === stepItem.num 
                  ? 'border-primary bg-primary text-white' 
                  : stepItem.completed 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 text-gray-500'
              }`}>
                {getStepIcon(stepItem.num)}
              </div>
              <span className={`text-sm font-medium ${
                currentStep === stepItem.num ? 'text-primary' : stepItem.completed ? 'text-green-600' : 'text-gray-500'
              }`}>
                {stepItem.title}
              </span>
            </div>
            {index < 2 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SellProductProgress;
