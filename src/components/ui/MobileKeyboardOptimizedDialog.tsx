import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileKeyboardOptimizedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileKeyboardOptimizedDialog: React.FC<MobileKeyboardOptimizedDialogProps> = ({
  open,
  onOpenChange,
  title,
  children,
  className,
}) => {
  const { isVisible: isKeyboardVisible, viewportHeight, scrollToActiveInput } = useVirtualKeyboard();
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle input focus on mobile when keyboard is visible
  useEffect(() => {
    if (!isMobile || !open) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => scrollToActiveInput(target), 300);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isMobile, open, scrollToActiveInput]);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent 
          ref={contentRef}
          className={cn(
            "max-h-[95vh] transition-all duration-300",
            isKeyboardVisible && "max-h-[50vh]",
            className
          )}
          style={isKeyboardVisible ? { 
            maxHeight: `${Math.min(viewportHeight * 0.6, 400)}px`,
            transform: 'translateY(0)'
          } : undefined}
        >
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-lg">{title}</DrawerTitle>
          </DrawerHeader>
          <div 
            className={cn(
              "px-4 pb-4 overflow-y-auto",
              isKeyboardVisible && "pb-safe"
            )}
            style={isKeyboardVisible ? {
              maxHeight: `${Math.min(viewportHeight * 0.5, 350)}px`
            } : undefined}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};