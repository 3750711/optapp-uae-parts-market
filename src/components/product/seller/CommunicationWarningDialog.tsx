
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle, User, Phone, Clock, Shield, CheckCircle } from "lucide-react";
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

  const getRatingDescription = (rating?: number | null) => {
    if (!rating) return "Собираем отзывы о продавце";
    if (rating <= 2) return "Легкая коммуникация";
    if (rating === 3) return "Средняя сложность";
    return "Сложная коммуникация";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Связь с продавцом
          </DialogTitle>
          
          {/* Карточка товара */}
          <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-primary">
            <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{productTitle}</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Лот: {lotNumber || 'не указан'}</span>
              <span className="font-semibold text-primary">{productPrice} ₽</span>
            </div>
          </div>
        </DialogHeader>
        
        <DialogDescription asChild>
          <div className="space-y-4">
            {/* Рейтинг коммуникации */}
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Сложность</span>
                </div>
                {communicationRating ? (
                  <CommunicationRatingBadge rating={communicationRating} size="md" />
                ) : (
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                    Собираем отзывы
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {getRatingDescription(communicationRating)}
              </p>
            </div>
            
            {/* Предупреждение для сложных случаев */}
            {isHighDifficulty && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-orange-800 text-sm">
                      Рекомендуем связаться через представителя
                    </p>
                    <p className="text-sm text-orange-700">
                      Это поможет избежать недопонимания
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Информация о времени работы */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>Представители: 9:00 - 21:00 (UTC+4)</span>
            </div>
          </div>
        </DialogDescription>
        
        <DialogFooter className="flex flex-col gap-2 mt-4">
          {/* Кнопка помощника */}
          <Button 
            onClick={handleAssistantContact}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <User className="h-4 w-4 mr-2" />
            Связаться через помощника partsbay.ae
          </Button>
          
          {/* Кнопка представителя (для сложных случаев) */}
          {isHighDifficulty && (
            <Button 
              onClick={handleRepresentativeContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Связаться через представителя
            </Button>
          )}
          
          {/* Прямая связь */}
          <Button 
            onClick={onProceed} 
            variant={isHighDifficulty ? "outline" : "default"}
            className="w-full"
            size="sm"
          >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            Прямая связь через {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
          </Button>
          
          {/* Кнопка отмены */}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-600 hover:text-gray-800"
            size="sm"
          >
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
