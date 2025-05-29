import React from "react";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { CommunicationRatingSection } from "./CommunicationRatingSection";
import { WorkingHoursInfo } from "./WorkingHoursInfo";
import { DialogButtons } from "./DialogButtons";
import { CommunicationWarningDialogProps } from "./types";

interface DesktopCommunicationDialogProps extends CommunicationWarningDialogProps {
  onAssistantContact: () => void;
}

export const DesktopCommunicationDialog: React.FC<DesktopCommunicationDialogProps> = ({
  onOpenChange,
  onProceed,
  onAssistantContact,
  communicationRating,
  productTitle,
  productPrice,
  lotNumber,
  contactType
}) => {
  return (
    <DialogContent className="hidden sm:block w-auto max-w-2xl mx-auto max-h-[90vh] overflow-hidden rounded-lg border bg-white shadow-lg">
      <DialogHeader className="space-y-4">
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
          <span>Связь с продавцом</span>
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
          onAssistantContact={onAssistantContact}
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
    </DialogContent>
  );
};
