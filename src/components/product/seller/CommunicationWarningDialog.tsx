
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
    // Упрощенный формат с латинскими символами
    return `Lot ${lotNumber || 'N/A'} - ${productTitle} - Price: ${productPrice} rub`;
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
    
    // Попробуем несколько вариантов
    try {
      // Вариант 1: tg:// протокол
      const tgUrl = `tg://resolve?domain=Nastya_PostingLots_OptCargo&text=${message}`;
      window.open(tgUrl, '_blank');
    } catch (error) {
      try {
        // Вариант 2: обычный https без encodeURIComponent
        const httpsUrl = `https://t.me/Nastya_PostingLots_OptCargo?text=${message}`;
        window.open(httpsUrl, '_blank');
      } catch (error2) {
        // Fallback: копируем в буфер обмена
        copyToClipboard(message);
        toast({
          title: "Откройте Telegram",
          description: "Сообщение скопировано. Вставьте его в чат с @Nastya_PostingLots_OptCargo",
        });
      }
    }
    
    onOpenChange(false);
  };

  const handleAssistantContact = () => {
    const message = createMessage();
    
    // Аналогичная логика для помощника
    try {
      const tgUrl = `tg://resolve?domain=Nastya_PostingLots_OptCargo&text=${message}`;
      window.open(tgUrl, '_blank');
    } catch (error) {
      try {
        const httpsUrl = `https://t.me/Nastya_PostingLots_OptCargo?text=${message}`;
        window.open(httpsUrl, '_blank');
      } catch (error2) {
        copyToClipboard(message);
        toast({
          title: "Откройте Telegram",
          description: "Сообщение скопировано. Вставьте его в чат с @Nastya_PostingLots_OptCargo",
        });
      }
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
