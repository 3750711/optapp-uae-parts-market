import React from "react";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { CommunicationRatingSection } from "./CommunicationRatingSection";
import { WorkingHoursInfo } from "./WorkingHoursInfo";
import { DialogButtons } from "./DialogButtons";
import { CommunicationWarningDialogProps } from "./types";

interface MobileCommunicationDialogProps extends CommunicationWarningDialogProps {
  onAssistantContact: () => void;
}

export const MobileCommunicationDialog: React.FC<MobileCommunicationDialogProps> = ({
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
    <DialogContent className="w-[95vw] sm:hidden max-w-md mx-auto max-h-[85vh] p-0 gap-0 overflow-hidden rounded-lg border bg-white shadow-lg">
      {/* Прокручиваемый контент для мобильных */}
      <div className="overflow-y-auto max-h-[calc(85vh-120px)] min-h-0">
        <DialogHeader className="p-4 pb-3 space-y-3 border-b bg-gray-50/50">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate">Связь с продавцом</span>
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
          onAssistantContact={onAssistantContact}
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
    </DialogContent>
  );
};
