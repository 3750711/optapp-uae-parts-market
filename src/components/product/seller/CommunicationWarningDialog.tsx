
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, X } from "lucide-react";
import { ProductCard } from "./communication/ProductCard";
import { CommunicationRatingSection } from "./communication/CommunicationRatingSection";
import { WorkingHoursInfo } from "./communication/WorkingHoursInfo";
import { DialogButtons } from "./communication/DialogButtons";
import { CommunicationWarningDialogProps } from "./communication/types";
import { useIsMobile } from "@/hooks/use-mobile";

export const CommunicationWarningDialog: React.FC<CommunicationWarningDialogProps> = ({
  open,
  onOpenChange,
  onProceed,
  communicationRating,
  productTitle,
  productPrice,
  lotNumber,
  contactType
}) => {
  const isMobile = useIsMobile();

  const handleAssistantContact = () => {
    const currentUrl = window.location.href;
    const productUrl = currentUrl.replace(
      /https:\/\/[^\/]+/,
      'https://partsbay.ae'
    );
    const telegramUrl = `https://t.me/Nastya_PostingLots_OptCargo?text=${encodeURIComponent(productUrl)}`;
    
    try {
      window.open(telegramUrl, '_blank');
    } catch (error) {
      console.error('Failed to open Telegram:', error);
    }
    
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    if (communicationRating === 1) {
      return "Связь через помощника";
    } else if (communicationRating === 5) {
      return "Связь с профессионалом";
    }
    return "Связь с продавцом";
  };

  const getDialogIcon = () => {
    if (communicationRating === 1) {
      return "🆘";
    } else if (communicationRating === 5) {
      return "⭐";
    }
    return "💬";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`
        ${isMobile 
          ? "w-[88vw] max-w-[calc(100vw-16px)] h-auto max-h-[90vh]" 
          : "w-full max-w-md h-auto max-h-[85vh]"
        } 
        mx-auto overflow-hidden rounded-xl border border-border bg-background 
        shadow-elevation p-0 gap-0
      `}>
        
        {/* Кнопка закрытия */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border transition-all hover:bg-muted hover:scale-110 active:scale-95 shadow-sm"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {/* Заголовок */}
        <DialogHeader className="relative overflow-hidden rounded-t-xl bg-primary p-4 text-primary-foreground">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">{getDialogIcon()}</span>
            <span>{getDialogTitle()}</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Основной контент */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 py-3' : 'px-4 py-4'} space-y-3`}>
          <DialogDescription asChild>
            <div className="space-y-3">
              {/* Карточка товара */}
              <ProductCard 
                productTitle={productTitle}
                productPrice={productPrice}
                lotNumber={lotNumber}
                isMobile={isMobile}
              />

              {/* Рейтинг коммуникации */}
              <CommunicationRatingSection 
                communicationRating={communicationRating}
                isMobile={isMobile}
              />

              {/* Информация о времени работы */}
              <WorkingHoursInfo isMobile={isMobile} />
            </div>
          </DialogDescription>
        </div>
        
        {/* Нижние кнопки */}
        <div className="relative overflow-hidden rounded-b-xl bg-muted/30 border-t border-border p-0">
          <DialogButtons 
            onAssistantContact={handleAssistantContact}
            onProceed={onProceed}
            onCancel={() => onOpenChange(false)}
            communicationRating={communicationRating}
            contactType={contactType}
            productTitle={productTitle}
            productPrice={productPrice}
            lotNumber={lotNumber}
            isMobile={isMobile}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
