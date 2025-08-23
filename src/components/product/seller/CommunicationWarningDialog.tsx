import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { ProductCard } from "./communication/ProductCard";
import { CommunicationRatingSection } from "./communication/CommunicationRatingSection";
import { WorkingHoursInfo } from "./communication/WorkingHoursInfo";
import { DialogButtons } from "./communication/DialogButtons";
import { ContactErrorFallback } from "./communication/ContactErrorFallback";
import { CommunicationWarningDialogProps } from "./communication/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContactValidation } from "@/hooks/useContactValidation";
import { useContactAnalytics } from "@/hooks/useContactAnalytics";
import { useLanguage } from "@/hooks/useLanguage";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";
import { CONTACT_CONFIG } from "@/config/contact";
import { toast } from "sonner";

export const CommunicationWarningDialog: React.FC<CommunicationWarningDialogProps> = ({
  open,
  onOpenChange,
  onProceed,
  communicationRating,
  productTitle,
  productPrice,
  lotNumber,
  contactType,
  sellerContact,
  productId,
  sellerId
}) => {
  const isMobile = useIsMobile();
  const validation = useContactValidation(sellerContact, contactType);
  const analytics = useContactAnalytics();
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);

  // Analytics tracking
  useEffect(() => {
    if (open) {
      analytics.trackDialogOpened({
        productId,
        sellerId,
        contactType,
        communicationRating,
        lotNumber,
      });
    }
  }, [open, analytics, productId, sellerId, contactType, communicationRating, lotNumber]);

  const handleAssistantContact = () => {
    const currentUrl = window.location.href;
    const productUrl = currentUrl.replace(
      /https:\/\/[^\/]+/,
      'https://partsbay.ae'
    );
    
    const managerUsername = CONTACT_CONFIG.TELEGRAM_MANAGER.username;
    const telegramUrl = `https://t.me/${managerUsername}?text=${encodeURIComponent(productUrl)}`;
    
    try {
      window.open(telegramUrl, '_blank');
      
      // Track analytics
      analytics.trackManagerContact({
        productId,
        sellerId,
        contactType: 'manager',
        communicationRating,
        lotNumber,
      });
      
      toast.success(sp.communication?.connectingToTelegram || 'Переходим в Telegram к менеджеру');
    } catch (error) {
      console.error('Failed to open Telegram:', error);
      
      // Fallback to alternative contact
      const fallbackUrl = CONTACT_CONFIG.TELEGRAM_MANAGER.fallbackUrl;
      try {
        window.open(fallbackUrl, '_blank');
        toast.info(sp.communication?.usingFallbackLink || 'Используем резервную ссылку для связи');
      } catch (fallbackError) {
        toast.error(sp.communication?.telegramError || 'Не удалось открыть Telegram. Попробуйте позже.');
      }
    }
    
    onOpenChange(false);
  };

  const handleDirectContact = () => {
    // Track analytics before proceeding
    analytics.trackDirectContact({
      productId,
      sellerId,
      contactType,
      communicationRating,
      lotNumber,
    });
    
    onProceed();
  };

  const handleCancel = () => {
    analytics.trackDialogCancelled({
      productId,
      sellerId,
      contactType,
      communicationRating,
      lotNumber,
    });
    
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    if (communicationRating === 1) {
      return sp.communication?.assistantContact || "Связь через помощника";
    } else if (communicationRating === 5) {
      return sp.communication?.professionalContact || "Связь с профессионалом";
    }
    return sp.communication?.sellerContact || "Связь с продавцом";
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

              {/* Показать ошибки валидации если есть */}
              {validation.validationErrors.length > 0 && validation.fallbackToManager && (
                <ContactErrorFallback
                  errors={validation.validationErrors}
                  onManagerContact={handleAssistantContact}
                  showRetry={false}
                />
              )}

              {/* Рейтинг коммуникации - показываем только если нет критических ошибок */}
              {validation.validationErrors.length === 0 && (
                <CommunicationRatingSection 
                  communicationRating={communicationRating}
                  isMobile={isMobile}
                />
              )}

              {/* Информация о времени работы */}
              <WorkingHoursInfo 
                isMobile={isMobile}
                customHours={sellerContact?.working_hours || null}
              />
            </div>
          </DialogDescription>
        </div>
        
        {/* Кнопки - показываем только если нет критических ошибок валидации */}
        {validation.validationErrors.length === 0 && (
          <div className="border-t bg-gray-50">
            <DialogButtons 
              onAssistantContact={handleAssistantContact}
              onProceed={handleDirectContact}
              onCancel={handleCancel}
              communicationRating={communicationRating}
              contactType={contactType}
              productTitle={productTitle}
              productPrice={productPrice}
              lotNumber={lotNumber}
              isMobile={isMobile}
              validation={validation}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};