import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { MobileCommunicationDialog } from "./communication/MobileCommunicationDialog";
import { DesktopCommunicationDialog } from "./communication/DesktopCommunicationDialog";
import { CommunicationWarningDialogProps } from "./communication/types";
import { toast } from "@/hooks/use-toast";

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
  const createMessage = () => {
    // Оставляем название товара как есть для точности
    const cleanTitle = productTitle
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .trim();
    
    // Полное сообщение на русском языке
    return `Добрый день меня интересует товар Lot ${lotNumber || 'N/A'} - ${cleanTitle} - Price ${productPrice} USD, свяжитесь пожалуйста с продавцем узнайте в наличии ли он и какая будет цена со скидкой`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Скопировано",
        description: "Сообщение скопировано в буфер обмена",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать сообщение",
        variant: "destructive",
      });
    }
  };

  const handleRepresentativeContact = () => {
    const message = createMessage();
    
    // Используем правильное кодирование для Telegram
    const encodedMessage = encodeURIComponent(message);
    const telegramUrl = `https://t.me/Nastya_PostingLots_OptCargo?text=${encodedMessage}`;
    
    try {
      window.open(telegramUrl, '_blank');
    } catch (error) {
      // Fallback: копируем в буфер обмена
      copyToClipboard(message);
      toast({
        title: "Откройте Telegram",
        description: "Сообщение скопировано. Вставьте его в чат с @Nastya_PostingLots_OptCargo",
      });
    }
    
    onOpenChange(false);
  };

  const handleAssistantContact = () => {
    const message = createMessage();
    
    // Аналогичная логика для помощника
    const encodedMessage = encodeURIComponent(message);
    const telegramUrl = `https://t.me/Nastya_PostingLots_OptCargo?text=${encodedMessage}`;
    
    try {
      window.open(telegramUrl, '_blank');
    } catch (error) {
      // Fallback: копируем в буфер обмена
      copyToClipboard(message);
      toast({
        title: "Откройте Telegram",
        description: "Сообщение скопировано. Вставьте его в чат с @Nastya_PostingLots_OptCargo",
      });
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Мобильная версия */}
      <MobileCommunicationDialog 
        open={open}
        onOpenChange={onOpenChange}
        onProceed={onProceed}
        onAssistantContact={handleAssistantContact}
        communicationRating={communicationRating}
        productTitle={productTitle}
        productPrice={productPrice}
        lotNumber={lotNumber}
        contactType={contactType}
      />

      {/* Десктопная версия */}
      <DesktopCommunicationDialog 
        open={open}
        onOpenChange={onOpenChange}
        onProceed={onProceed}
        onAssistantContact={handleAssistantContact}
        communicationRating={communicationRating}
        productTitle={productTitle}
        productPrice={productPrice}
        lotNumber={lotNumber}
        contactType={contactType}
      />
    </Dialog>
  );
};
