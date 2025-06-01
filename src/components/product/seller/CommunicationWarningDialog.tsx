
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
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
    // Получаем текущий URL и заменяем домен на основной
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

  // Определяем заголовок в зависимости от рейтинга
  const getDialogTitle = () => {
    if (communicationRating === 1) {
      return "Связаться через помощника";
    } else if (communicationRating === 5) {
      return "Связаться с профессионалом";
    }
    return "Уточнить детали у продавца";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${
        isMobile 
          ? "w-[95vw] max-w-sm mx-auto max-h-[90vh] overflow-hidden rounded-lg border bg-white shadow-lg"
          : "w-auto max-w-lg mx-auto max-h-[85vh] overflow-hidden rounded-lg border bg-white shadow-lg"
      }`}>
        {/* Заголовок */}
        <DialogHeader className={`${isMobile ? 'p-4 pb-2' : 'p-6 pb-3'} border-b bg-gray-50/50 flex-shrink-0`}>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
            <span className={isMobile ? 'text-sm' : 'text-base'}>{getDialogTitle()}</span>
          </DialogTitle>
          
          {/* Карточка товара в заголовке для экономии места */}
          <ProductCard 
            productTitle={productTitle}
            productPrice={productPrice}
            lotNumber={lotNumber}
            isMobile={isMobile}
          />
        </DialogHeader>
        
        {/* Прокручиваемый контент */}
        <div className={`overflow-y-auto flex-1 ${isMobile ? 'px-4 py-2' : 'px-6 py-4'}`}>
          <DialogDescription asChild>
            <div className="space-y-3">
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
        
        {/* Фиксированный футер с кнопками */}
        <DialogFooter className="flex-shrink-0 border-t bg-white">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
