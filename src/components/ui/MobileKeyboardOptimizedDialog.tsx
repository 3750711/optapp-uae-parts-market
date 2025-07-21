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

    let initialViewportHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // Считаем что клавиатура видна если высота уменьшилась больше чем на 150px
      setIsKeyboardVisible(heightDifference > 150);
    };

    const handleFocus = () => {
      // Небольшая задержка для корректного определения размера
      setTimeout(handleResize, 300);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);

    // Инициальная проверка
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
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
          isKeyboardVisible && "max-h-[50vh]",
          className
        )}
        style={{
          position: 'fixed',
          top: isKeyboardVisible ? '5vh' : '50%',
          left: '50%',
          transform: isKeyboardVisible ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          transition: 'all 0.2s ease-in-out'
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