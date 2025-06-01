
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
          ? "w-[95vw] max-w-md mx-auto max-h-[85vh] overflow-hidden rounded-lg border bg-white shadow-lg"
          : "w-auto max-w-2xl mx-auto max-h-[90vh] overflow-hidden rounded-lg border bg-white shadow-lg"
      }`}>
        {isMobile ? (
          <>
            {/* Мобильная версия с прокруткой */}
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] min-h-0">
              <DialogHeader className="p-4 pb-3 space-y-3 border-b bg-gray-50/50">
                <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                  <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="truncate">{getDialogTitle()}</span>
                </DialogTitle>
                
                {/* Компактная карточка товара */}
                <ProductCard 
                  productTitle={productTitle}
                  productPrice={productPrice}
                  lotNumber={lotNumber}
                  isMobile={true}
                />
              </DialogHeader>
              
              <DialogDescription asChild>
                <div className="p-4 space-y-4">
                  {/* Рейтинг коммуникации с подробной информацией */}
                  <CommunicationRatingSection 
                    communicationRating={communicationRating}
                    isMobile={true}
                  />

                  {/* Информация о времени работы */}
                  <WorkingHoursInfo isMobile={true} />
                </div>
              </DialogDescription>
            </div>
            
            {/* Фиксированный футер с кнопками для мобильных */}
            <DialogFooter>
              <DialogButtons 
                onAssistantContact={handleAssistantContact}
                onProceed={onProceed}
                onCancel={() => onOpenChange(false)}
                communicationRating={communicationRating}
                contactType={contactType}
                productTitle={productTitle}
                productPrice={productPrice}
                lotNumber={lotNumber}
                isMobile={true}
              />
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Десктопная версия */}
            <DialogHeader className="space-y-4">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{getDialogTitle()}</span>
              </DialogTitle>
              
              {/* Карточка товара для десктопа */}
              <ProductCard 
                productTitle={productTitle}
                productPrice={productPrice}
                lotNumber={lotNumber}
                isMobile={false}
              />
            </DialogHeader>
            
            <DialogDescription asChild>
              <div className="space-y-4">
                {/* Рейтинг коммуникации с подробной информацией */}
                <CommunicationRatingSection 
                  communicationRating={communicationRating}
                  isMobile={false}
                />

                {/* Информация о времени работы */}
                <WorkingHoursInfo isMobile={false} />
              </div>
            </DialogDescription>
            
            {/* Футер для десктопа */}
            <DialogFooter>
              <DialogButtons 
                onAssistantContact={handleAssistantContact}
                onProceed={onProceed}
                onCancel={() => onOpenChange(false)}
                communicationRating={communicationRating}
                contactType={contactType}
                productTitle={productTitle}
                productPrice={productPrice}
                lotNumber={lotNumber}
                isMobile={false}
              />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
