
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
      {/* Мобильная версия */}
      <DialogContent className="w-[95vw] sm:hidden max-w-md mx-auto max-h-[85vh] p-0 gap-0 overflow-hidden rounded-lg border bg-white shadow-lg">
        {/* Прокручиваемый контент для мобильных */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] min-h-0">
          <DialogHeader className="p-4 pb-3 space-y-3 border-b bg-gray-50/50">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">Связь с продавцом</span>
            </DialogTitle>
            
            {/* Компактная карточка товара */}
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">
                {truncateTitle(productTitle, 80)}
              </h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Лот: {lotNumber || '—'}</span>
                <span className="font-semibold text-primary text-base">{productPrice} ₽</span>
              </div>
            </div>
          </DialogHeader>
          
          <DialogDescription asChild>
            <div className="p-4 space-y-4">
              {/* Рейтинг коммуникации */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Сложность общения</span>
                  </div>
                  {communicationRating ? (
                    <CommunicationRatingBadge rating={communicationRating} size="md" />
                  ) : (
                    <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 font-medium">
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
                        Рекомендуем представителя
                      </p>
                      <p className="text-sm text-orange-700">
                        Поможет избежать недопонимания и ускорить сделку
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Информация о времени работы */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>Представители работают: 9:00 - 21:00 (UTC+4)</span>
              </div>
            </div>
          </DialogDescription>
        </div>
        
        {/* Фиксированный футер с кнопками для мобильных */}
        <DialogFooter className="flex flex-col gap-2 p-4 pt-3 border-t bg-white sticky bottom-0">
          {/* Кнопка помощника */}
          <Button 
            onClick={handleAssistantContact}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium order-1"
            size="default"
          >
            <User className="h-4 w-4 mr-2" />
            <span>Помощник partsbay.ae</span>
          </Button>
          
          {/* Кнопка представителя (для сложных случаев) */}
          {isHighDifficulty && (
            <Button 
              onClick={handleRepresentativeContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-10 font-medium order-2"
              size="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Связаться с представителем</span>
            </Button>
          )}
          
          {/* Прямая связь */}
          <Button 
            onClick={onProceed} 
            variant={isHighDifficulty ? "outline" : "default"}
            className="w-full h-10 font-medium order-3"
            size="default"
          >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            <span>
              Прямая связь {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
            </span>
          </Button>
          
          {/* Кнопка отмены */}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-600 hover:text-gray-800 h-9 font-medium order-4"
            size="default"
          >
            <span>Отмена</span>
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Десктопная версия */}
      <DialogContent className="hidden sm:block w-auto max-w-2xl mx-auto max-h-[90vh] overflow-hidden rounded-lg border bg-white shadow-lg">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
            <span>Связь с продавцом</span>
          </DialogTitle>
          
          {/* Карточка товара для десктопа */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 text-base mb-3 leading-tight">
              {productTitle}
            </h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Лот: {lotNumber || '—'}</span>
              <span className="font-semibold text-primary text-lg">{productPrice} ₽</span>
            </div>
          </div>
        </DialogHeader>
        
        <DialogDescription asChild>
          <div className="space-y-4">
            {/* Рейтинг коммуникации */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <span className="text-base font-medium text-gray-700">Сложность общения</span>
                </div>
                {communicationRating ? (
                  <CommunicationRatingBadge rating={communicationRating} size="md" />
                ) : (
                  <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-200 font-medium">
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
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-orange-800">
                      Рекомендуем представителя
                    </p>
                    <p className="text-sm text-orange-700">
                      Поможет избежать недопонимания и ускорить сделку
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Информация о времени работы */}
            <div className="flex items-center gap-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span>Представители работают: 9:00 - 21:00 (UTC+4)</span>
            </div>
          </div>
        </DialogDescription>
        
        {/* Футер для десктопа */}
        <DialogFooter className="flex flex-row gap-3 pt-6">
          {/* Кнопка помощника */}
          <Button 
            onClick={handleAssistantContact}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium"
            size="default"
          >
            <User className="h-4 w-4 mr-2" />
            <span>Помощник partsbay.ae</span>
          </Button>
          
          {/* Кнопка представителя (для сложных случаев) */}
          {isHighDifficulty && (
            <Button 
              onClick={handleRepresentativeContact}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11 font-medium"
              size="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Связаться с представителем</span>
            </Button>
          )}
          
          {/* Прямая связь */}
          <Button 
            onClick={onProceed} 
            variant={isHighDifficulty ? "outline" : "default"}
            className="flex-1 h-11 font-medium"
            size="default"
          >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            <span>
              Прямая связь {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
            </span>
          </Button>
          
          {/* Кнопка отмены */}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-auto text-gray-600 hover:text-gray-800 h-11 font-medium px-6"
            size="default"
          >
            <span>Отмена</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
