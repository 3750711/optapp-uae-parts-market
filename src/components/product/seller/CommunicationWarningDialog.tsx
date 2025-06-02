
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
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
    const message = `Здравствуйте! Прошу помочь с переговорами по этому объявлению: ${productUrl}`;
    const telegramUrl = `https://t.me/Nastya_PostingLots_OptCargo?text=${encodeURIComponent(message)}`;
    
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`
        ${isMobile 
          ? "w-[90vw] max-w-[calc(100vw-32px)] h-auto max-h-[85vh]" 
          : "w-full max-w-md h-auto"
        } 
        mx-auto overflow-hidden rounded-lg bg-white shadow-lg border p-0 gap-0
      `}>
        
        {/* Кнопка закрытия */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-2 z-50 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>

        {/* Заголовок */}
        <DialogHeader className="bg-gray-50 border-b px-4 py-3">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>
        
        {/* Основной контент */}
        <div className="p-4 space-y-4">
          <DialogDescription asChild>
            <div className="space-y-4">
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
        
        {/* Кнопки */}
        <div className="border-t bg-gray-50">
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
