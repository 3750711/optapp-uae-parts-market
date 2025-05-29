
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle, User } from "lucide-react";
import { CommunicationRatingBadge } from "@/components/admin/CommunicationRatingBadge";

interface CommunicationWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  communicationRating?: number | null;
  productTitle: string;
  productPrice: number;
  lotNumber?: number | null;
  contactType: 'telegram' | 'whatsapp';
}

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
  const isHighDifficulty = communicationRating && communicationRating >= 4;
  
  const handleRepresentativeContact = () => {
    const message = `Лот ${lotNumber || 'не указан'}\n${productTitle}\nЦена: ${productPrice} ₽`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://t.me/Nastya_PostingLots_OptCargo?text=${encodedMessage}`, '_blank');
    onOpenChange(false);
  };

  const handleAssistantContact = () => {
    const message = `Лот ${lotNumber || 'не указан'}\n${productTitle}\nЦена: ${productPrice} ₽`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://t.me/Nastya_PostingLots_OptCargo?text=${encodedMessage}`, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Связь с продавцом
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Сложность коммуникации:</span>
                {communicationRating ? (
                  <CommunicationRatingBadge rating={communicationRating} size="md" />
                ) : (
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    Собираем отзывы
                  </span>
                )}
              </div>
              
              {isHighDifficulty && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-800 mb-1">
                        Настоятельно рекомендуем связаться через нашего представителя
                      </p>
                      <p className="text-orange-700">
                        Это поможет избежать недопонимания и ускорить процесс покупки
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col gap-2 sm:gap-2">
          <Button 
            onClick={handleAssistantContact}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <User className="mr-2 h-4 w-4" />
            Связаться через помощника partsbay.ae
          </Button>
          
          {isHighDifficulty && (
            <Button 
              onClick={handleRepresentativeContact}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Связаться через представителя
            </Button>
          )}
          
          <Button 
            onClick={onProceed} 
            variant={isHighDifficulty ? "outline" : "default"}
            className="w-full"
          >
            Продолжить связь через {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
