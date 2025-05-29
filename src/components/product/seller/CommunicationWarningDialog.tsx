
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle, User, Phone, Clock, Shield, CheckCircle, AlertCircle, Info } from "lucide-react";
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
  const isVeryDifficult = communicationRating === 1 || communicationRating === 2;
  const isProfessional = communicationRating === 5;
  
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

  const getCommunicationInfo = (rating?: number | null) => {
    if (!rating) return {
      title: "Собираем отзывы",
      description: "Информация о сложности общения с продавцом пока недоступна",
      icon: Info,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    };

    switch (rating) {
      case 1:
        return {
          title: "Невозможно договориться напрямую",
          description: "Не возможно договориться с продавцем напрямую, только через помощника partsbay",
          icon: AlertCircle,
          color: "red",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
          recommendation: "Обязательно используйте помощника для связи"
        };
      case 2:
        return {
          title: "Очень сложно договориться",
          description: "Очень сложно договориться, только на английском, советуем воспользоваться помощником partsbay",
          icon: AlertTriangle,
          color: "orange",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-700",
          recommendation: "Рекомендуем помощника для комфортного общения"
        };
      case 3:
        return {
          title: "Можно договориться",
          description: "Можно договориться, но только на английском",
          icon: MessageSquare,
          color: "yellow",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-700",
          recommendation: "Готовьтесь к общению на английском языке"
        };
      case 4:
        return {
          title: "Свободно общается",
          description: "Свободно общается, можно писать на русском, использует переводчик",
          icon: CheckCircle,
          color: "green",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-700",
          recommendation: "Можете смело писать на русском языке"
        };
      case 5:
        return {
          title: "Профессионал",
          description: "Профи, только прямая связь",
          icon: CheckCircle,
          color: "emerald",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          textColor: "text-emerald-700",
          recommendation: "Отличный продавец для прямого общения"
        };
      default:
        return {
          title: "Неизвестный уровень",
          description: "Информация о коммуникации недоступна",
          icon: Info,
          color: "gray",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-700"
        };
    }
  };

  // Сокращенный заголовок для мобильных
  const truncateTitle = (title: string, maxLength: number) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const commInfo = getCommunicationInfo(communicationRating);
  const CommIcon = commInfo.icon;

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
              {/* Рейтинг коммуникации с подробной информацией */}
              <div className={`${commInfo.bgColor} border ${commInfo.borderColor} rounded-lg p-3`}>
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
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CommIcon className={`h-4 w-4 ${commInfo.textColor} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`text-sm font-medium ${commInfo.textColor}`}>
                        {commInfo.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {commInfo.description}
                      </p>
                      {commInfo.recommendation && (
                        <p className={`text-xs ${commInfo.textColor} font-medium mt-1`}>
                          💡 {commInfo.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Предупреждение для очень сложных случаев */}
              {isVeryDifficult && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-red-800 text-sm">
                        Обязательно используйте помощника
                      </p>
                      <p className="text-sm text-red-700">
                        Прямое общение с этим продавцом крайне затруднено
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Информация для профессионалов */}
              {isProfessional && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-emerald-800 text-sm">
                        Отличный продавец!
                      </p>
                      <p className="text-sm text-emerald-700">
                        Профессионал с отличной репутацией. Рекомендуем прямую связь
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
          {/* Кнопка помощника - показываем всегда */}
          <Button 
            onClick={handleAssistantContact}
            className={`w-full ${isVeryDifficult ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white h-10 font-medium order-1`}
            size="default"
          >
            <User className="h-4 w-4 mr-2" />
            <span>{isVeryDifficult ? 'Связаться через помощника' : 'Помощник partsbay.ae'}</span>
          </Button>
          
          {/* Прямая связь - изменяем приоритет в зависимости от сложности */}
          {!isProfessional && (
            <Button 
              onClick={onProceed} 
              variant={isVeryDifficult ? "outline" : "default"}
              className={`w-full h-10 font-medium order-${isVeryDifficult ? '3' : '2'}`}
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
          )}

          {/* Для профессионалов - прямая связь как основная кнопка */}
          {isProfessional && (
            <Button 
              onClick={onProceed} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-medium order-2"
              size="default"
            >
              {contactType === 'telegram' ? (
                <MessageSquare className="h-4 w-4 mr-2" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              <span>
                Связаться с профи {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
              </span>
            </Button>
          )}
          
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
            {/* Рейтинг коммуникации с подробной информацией */}
            <div className={`${commInfo.bgColor} border ${commInfo.borderColor} rounded-lg p-4`}>
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
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CommIcon className={`h-5 w-5 ${commInfo.textColor} mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className={`font-medium ${commInfo.textColor} mb-1`}>
                      {commInfo.title}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {commInfo.description}
                    </p>
                    {commInfo.recommendation && (
                      <p className={`text-sm ${commInfo.textColor} font-medium`}>
                        💡 {commInfo.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Предупреждение для очень сложных случаев */}
            {isVeryDifficult && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">
                      Обязательно используйте помощника
                    </p>
                    <p className="text-sm text-red-700">
                      Прямое общение с этим продавцом крайне затруднено. Рекомендуем обязательно использовать помощника для успешной сделки
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Информация для профессионалов */}
            {isProfessional && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-emerald-800">
                      Отличный продавец!
                    </p>
                    <p className="text-sm text-emerald-700">
                      Профессионал с отличной репутацией. Этот продавец зарекомендовал себя как надежный партнер для прямого общения
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
          {/* Кнопка помощника - приоритет для сложных случаев */}
          <Button 
            onClick={handleAssistantContact}
            className={`flex-1 ${isVeryDifficult ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white h-11 font-medium`}
            size="default"
          >
            <User className="h-4 w-4 mr-2" />
            <span>{isVeryDifficult ? 'Связаться через помощника' : 'Помощник partsbay.ae'}</span>
          </Button>
          
          {/* Прямая связь - адаптируем под уровень сложности */}
          {!isProfessional && (
            <Button 
              onClick={onProceed} 
              variant={isVeryDifficult ? "outline" : "default"}
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
          )}

          {/* Для профессионалов - прямая связь как основная кнопка */}
          {isProfessional && (
            <Button 
              onClick={onProceed} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-medium"
              size="default"
            >
              {contactType === 'telegram' ? (
                <MessageSquare className="h-4 w-4 mr-2" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              <span>
                Связаться с профи {contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}
              </span>
            </Button>
          )}
          
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
