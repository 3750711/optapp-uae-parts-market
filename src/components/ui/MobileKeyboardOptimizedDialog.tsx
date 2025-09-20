import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface MobileKeyboardOptimizedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileKeyboardOptimizedDialog = ({
  open,
  onOpenChange,
  title,
  children,
  className,
}: MobileKeyboardOptimizedDialogProps) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Use visual viewport API when available for better detection
    const viewport = window.visualViewport;
    let initialViewportHeight = viewport ? viewport.height : window.innerHeight;
    let timeoutId: NodeJS.Timeout;
    
    const handleViewportChange = () => {
      const currentHeight = viewport ? viewport.height : window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Keyboard is visible if height decreased by more than 150px
      // Add debouncing to prevent flickering
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsKeyboardVisible(heightDifference > 150);
      }, 100);
    };

    const handleFocus = (e: FocusEvent) => {
      // Only trigger for input elements
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setTimeout(handleViewportChange, 300);
      }
    };

    // Use visual viewport API when available
    if (viewport) {
      viewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }
    
    document.addEventListener('focusin', handleFocus);

    // Initial check
    handleViewportChange();

    return () => {
      clearTimeout(timeoutId);
      const viewport = window.visualViewport;
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      document.removeEventListener('focusin', handleFocus);
      setIsKeyboardVisible(false);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          // Адаптивные размеры для всех устройств
          "w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl",
          // Адаптивные отступы
          "p-4 sm:p-6 md:p-8", 
          // Адаптивные внешние отступы
          "mx-2 sm:mx-4 md:mx-auto",
          // Адаптивная высота
          "max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh]",
          // Переполнение контента
          "overflow-hidden",
          // Smooth transitions
          "transition-all duration-300 ease-in-out",
          // Мобильная оптимизация при клавиатуре
          isKeyboardVisible && [
            "!max-h-[60vh] !fixed !top-4 !transform-none !translate-x-0 !translate-y-0",
            "!left-2 !right-2 !mx-0"
          ],
          className
        )}
      >
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <DialogTitle className="text-base sm:text-lg font-semibold text-center">{title}</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div 
          className={cn(
            "overflow-y-auto overflow-x-hidden",
            "flex-1 py-4",
            // Адаптивная высота контента
            isKeyboardVisible ? "max-h-[35vh]" : "max-h-[65vh] sm:max-h-[60vh] md:max-h-[55vh]"
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};