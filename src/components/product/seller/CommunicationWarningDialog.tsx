
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
    if (!rating) return "Собираем отзывы";
    if (rating <= 2) return "Легкая коммуникация";
    if (rating === 3) return "Средняя сложность";
    return "Сложная коммуникация";
  };

  // Сокращенный заголовок для мобильных
  const truncateTitle = (title: string, maxLength: number) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Прокручиваемый контент */}
        <div className="overflow-y-auto max-h-[70vh]">
          <DialogHeader className="p-4 pb-2 space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">Связь с продавцом</span>
            </DialogTitle>
            
            {/* Компактная карточка товара */}
            <div className="bg-gray-50 rounded-md p-2 border-l-3 border-primary">
              <h4 className="font-medium text-gray-900 text-xs mb-1 line-clamp-2">
                {truncateTitle(productTitle, 60)}
              </h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Лот: {lotNumber || '—'}</span>
                <span className="font-semibold text-primary">{productPrice} ₽</span>
              </div>
            </div>
          </DialogHeader>
          
          <DialogDescription asChild>
            <div className="px-4 space-y-3">
              {/* Компактный рейтинг коммуникации */}
              <div className="bg-white border rounded-md p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Сложность</span>
                  </div>
                  {communicationRating ? (
                    <CommunicationRatingBadge rating={communicationRating} size="md" />
                  ) : (
                    <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Собираем отзывы
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {getRatingDescription(communicationRating)}
                </p>
              </div>
              
              {/* Компактное предупреждение для сложных случаев */}
              {isHighDifficulty && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-medium text-orange-800 text-xs">
                        Рекомендуем представителя
                      </p>
                      <p className="text-xs text-orange-700">
                        Поможет избежать недопонимания
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Компактная информация о времени работы */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-blue-50 p-2 rounded-md">
                <Clock className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                <span>Представители: 9:00 - 21:00 (UTC+4)</span>
              </div>
            </div>
          </DialogDescription>
        </div>
        
        {/* Фиксированный футер с кнопками */}
        <DialogFooter className="flex flex-col gap-2 p-4 pt-2 border-t bg-white">
          {/* Кнопка помощника */}
          <Button 
            onClick={handleAssistantContact}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9"
            size="sm"
          >
            <User className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Помощник partsbay.ae</span>
          </Button>
          
          {/* Кнопка представителя (для сложных случаев) */}
          {isHighDifficulty && (
            <Button 
              onClick={handleRepresentativeContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-9"
              size="sm"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Представитель</span>
            </Button>
          )}
          
          {/* Прямая связь */}
          <Button 
            onClick={onProceed} 
            variant={isHighDifficulty ? "outline" : "default"}
            className="w-full h-9"
            size="sm"
          >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Phone className="h-3.5 w-3.5 mr-1.5" />
            )}
            <span className="text-xs">
              Прямая связь {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
            </span>
          </Button>
          
          {/* Кнопка отмены */}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-600 hover:text-gray-800 h-8"
            size="sm"
          >
            <span className="text-xs">Отмена</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
