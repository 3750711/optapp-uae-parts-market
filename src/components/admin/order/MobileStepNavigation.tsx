
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showNext?: boolean;
}

export const MobileStepNavigation: React.FC<MobileStepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  nextDisabled = false,
  nextLabel = "Далее",
  showNext = true
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 safe-area-bottom">
      <div className="flex justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2 touch-target min-h-[48px] flex-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад
        </Button>
        
        {showNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-2 touch-target min-h-[48px] flex-1"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
