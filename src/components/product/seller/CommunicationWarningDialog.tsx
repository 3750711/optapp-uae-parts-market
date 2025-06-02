
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
          ? "w-[90vw] max-w-[calc(100vw-24px)] h-[90vh] max-h-[90vh]" 
          : "w-full max-w-md h-auto max-h-[85vh]"
        } 
        mx-auto overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 
        shadow-2xl backdrop-blur-sm p-0 gap-0
      `}>
        
        {/* Кастомная кнопка закрытия */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>

        {/* Заголовок с градиентом */}
        <DialogHeader className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 p-4 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <DialogTitle className="relative z-10 flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">{getDialogIcon()}</span>
            <span>{getDialogTitle()}</span>
          </DialogTitle>
          
          {/* Волны в заголовке */}
          <div className="absolute bottom-0 left-0 right-0 h-4">
            <svg viewBox="0 0 400 40" className="h-full w-full">
              <path d="M0,20 Q100,0 200,20 T400,20 L400,40 L0,40 Z" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>
        </DialogHeader>
        
        {/* Основной контент */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 py-4' : 'px-5 py-4'} space-y-4`}>
          <DialogDescription asChild>
            <div className="space-y-4">
              {/* Карточка товара */}
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <ProductCard 
                  productTitle={productTitle}
                  productPrice={productPrice}
                  lotNumber={lotNumber}
                  isMobile={isMobile}
                />
              </div>

              {/* Рейтинг коммуникации */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <CommunicationRatingSection 
                  communicationRating={communicationRating}
                  isMobile={isMobile}
                />
              </div>

              {/* Информация о времени работы */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <WorkingHoursInfo isMobile={isMobile} />
              </div>
            </div>
          </DialogDescription>
        </div>
        
        {/* Нижние кнопки с градиентом */}
        <div className="relative overflow-hidden rounded-b-2xl bg-gradient-to-r from-gray-50 to-blue-50/50 p-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
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
