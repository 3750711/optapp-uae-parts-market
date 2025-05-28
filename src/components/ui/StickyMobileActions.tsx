
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface StickyMobileActionsProps {
  isSubmitting: boolean;
  progressStatus: { step: string; progress: number };
  onSubmit: () => void;
  submitText?: string;
  loadingText?: string;
}

const StickyMobileActions: React.FC<StickyMobileActionsProps> = ({
  isSubmitting,
  progressStatus,
  onSubmit,
  submitText = "Опубликовать",
  loadingText = "Публикация..."
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 safe-area-bottom">
      {isSubmitting && progressStatus.progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-600">
              {progressStatus.step || loadingText}
            </span>
            <span className="text-xs text-gray-500">{progressStatus.progress}%</span>
          </div>
          <Progress value={progressStatus.progress} className="h-1.5" />
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-medium"
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
};

export default StickyMobileActions;
