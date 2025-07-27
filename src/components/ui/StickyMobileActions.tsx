
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface StickyMobileActionsProps {
  isSubmitting: boolean;
  onSubmit: () => void;
  submitText?: string;
  loadingText?: string;
  disabled?: boolean;
}

const StickyMobileActions: React.FC<StickyMobileActionsProps> = ({
  isSubmitting,
  onSubmit,
  submitText = "Опубликовать",
  loadingText = "Публикация...",
  disabled = false
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 z-50 pb-safe shadow-lg">
      <div className="max-w-sm mx-auto">
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium touch-target bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          disabled={isSubmitting || disabled}
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
    </div>
  );
};

export default StickyMobileActions;
