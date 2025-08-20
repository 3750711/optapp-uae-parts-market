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
          "w-full max-w-sm mx-auto",
          "max-h-[85vh] overflow-hidden",
          "transition-all duration-200 ease-in-out",
          "safe-area-insets",
          isKeyboardVisible && [
            "max-h-[50vh]",
            "keyboard-visible"
          ],
          className
        )}
        style={{
          position: 'fixed',
          top: isKeyboardVisible ? 'max(5vh, env(safe-area-inset-top, 0px))' : '50%',
          left: '50%',
          transform: isKeyboardVisible ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          // Use CSS transition instead of inline for better browser support
          WebkitTransform: isKeyboardVisible ? 'translateX(-50%)' : 'translate(-50%, -50%)',
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        
        <div 
          className={cn(
            "overflow-y-auto overflow-x-hidden",
            "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
            isKeyboardVisible ? "max-h-[35vh]" : "max-h-[70vh]"
          )}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};