
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

  const getRatingColor = (rating?: number | null) => {
    if (!rating) return "blue";
    if (rating <= 2) return "green";
    if (rating === 3) return "yellow";
    return "red";
  };

  const getRatingDescription = (rating?: number | null) => {
    if (!rating) return "Собираем отзывы о продавце";
    if (rating <= 2) return "Легкая коммуникация";
    if (rating === 3) return "Средняя сложность";
    return "Сложная коммуникация";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg animate-fade-in">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            Связь с продавцом
          </DialogTitle>
          
          {/* Карточка товара */}
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 line-clamp-2">{productTitle}</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Лот: {lotNumber || 'не указан'}</span>
                <span className="font-semibold text-primary text-lg">{productPrice} ₽</span>
              </div>
            </div>
          </div>
          
          <DialogDescription asChild>
            <div className="space-y-4">
              {/* Рейтинг коммуникации */}
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Сложность коммуникации</span>
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
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-orange-100 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-orange-800">
                        Рекомендуем связаться через представителя
                      </p>
                      <p className="text-sm text-orange-700">
                        Это поможет избежать недопонимания и ускорить процесс покупки
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Информация о времени работы */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Представители работают: 9:00 - 21:00 (UTC+4)</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col gap-3 mt-6">
          {/* Кнопка помощника (всегда видна) */}
          <Button 
            onClick={handleAssistantContact}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 py-3"
            size="lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-1 bg-white/20 rounded-full">
                <User className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="font-medium">Связаться через помощника</div>
                <div className="text-xs text-blue-100">partsbay.ae • Быстрый ответ</div>
              </div>
            </div>
          </Button>
          
          {/* Кнопка представителя (для сложных случаев) */}
          {isHighDifficulty && (
            <Button 
              onClick={handleRepresentativeContact}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 py-3"
              size="lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white/20 rounded-full">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Связаться через представителя</div>
                  <div className="text-xs text-green-100">Рекомендуется • Профессиональная помощь</div>
                </div>
              </div>
            </Button>
          )}
          
          {/* Прямая связь */}
          <Button 
            onClick={onProceed} 
            variant={isHighDifficulty ? "outline" : "default"}
            className={`w-full transition-all duration-300 hover:-translate-y-0.5 py-3 ${
              isHighDifficulty 
                ? "border-2 hover:bg-gray-50" 
                : "bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl"
            }`}
            size="lg"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-full ${
                isHighDifficulty ? "bg-gray-100" : "bg-white/20"
              }`}>
                {contactType === 'telegram' ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium">
                  Продолжить связь через {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
                </div>
                <div className={`text-xs ${
                  isHighDifficulty ? "text-gray-500" : "text-white/80"
                }`}>
                  Прямая связь с продавцом
                </div>
              </div>
            </div>
          </Button>
          
          {/* Кнопка отмены */}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
