
import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { MobileCommunicationDialog } from "./communication/MobileCommunicationDialog";
import { DesktopCommunicationDialog } from "./communication/DesktopCommunicationDialog";
import { CommunicationWarningDialogProps } from "./communication/types";

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
  const createSimpleMessage = () => {
    return `Мне нужно помощь с товаром (Лот ${lotNumber || 'N/A'}, ${productTitle}, ${productPrice} USD)`;
  };

  const handleAssistantContact = () => {
    const message = createSimpleMessage();
    const telegramUrl = `https://t.me/Nastya_PostingLots_OptCargo?text=${message}`;
    
    try {
      window.open(telegramUrl, '_blank');
    } catch (error) {
      console.error('Failed to open Telegram:', error);
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
