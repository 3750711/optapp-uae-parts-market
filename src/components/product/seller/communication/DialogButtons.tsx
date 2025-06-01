
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, User, HeadphonesIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DialogButtonsProps {
  onAssistantContact: () => void;
  onProceed: () => void;
  onCancel: () => void;
  communicationRating?: number | null;
  contactType: 'telegram' | 'whatsapp';
  isMobile?: boolean;
  productTitle?: string;
  productPrice?: number;
  lotNumber?: number | null;
}

export const DialogButtons: React.FC<DialogButtonsProps> = ({
  onAssistantContact,
  onProceed,
  onCancel,
  communicationRating,
  contactType,
  isMobile = false,
  productTitle = "",
  productPrice = 0,
  lotNumber
}) => {
  const isVeryDifficult = communicationRating === 1 || communicationRating === 2;
  const isProfessional = communicationRating === 5;
  const isDirectContactBlocked = communicationRating === 1;

  const buttonHeight = isMobile ? "h-10" : "h-11";
  const cancelHeight = isMobile ? "h-9" : "h-11";

  // Определяем тексты кнопок
  const getAssistantButtonText = () => {
    if (isVeryDifficult) {
      return isMobile ? 'Помощник partsbay.ae' : 'Связаться через помощника сайта';
    }
    return isMobile ? 'Помощник partsbay.ae' : 'Задать вопрос помощнику сайта';
  };

  const getDirectContactButtonText = () => {
    if (isProfessional) {
      return isMobile 
        ? `Связаться с профи ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`
        : `Написать профессионалу в ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`;
    }
    return isMobile
      ? `Прямая связь ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`
      : `Написать продавцу в ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`;
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 p-4 pt-3 border-t bg-white sticky bottom-0">
        {/* Кнопка помощника - показываем всегда */}
        <Button 
          onClick={onAssistantContact}
          className={`w-full ${isVeryDifficult ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white ${buttonHeight} font-medium order-1`}
          size="default"
        >
          <HeadphonesIcon className="h-4 w-4 mr-2" />
          <span>{getAssistantButtonText()}</span>
        </Button>
        
        {/* Прямая связь - блокируем для рейтинга 1 */}
        {!isProfessional && !isDirectContactBlocked && (
          <Button 
            onClick={onProceed} 
            variant={isVeryDifficult ? "outline" : "default"}
            className={`w-full ${isVeryDifficult ? 'border-green-600 text-green-700 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'} ${buttonHeight} font-medium order-2`}
            size="default"
          >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            <span>{getDirectContactButtonText()}</span>
          </Button>
        )}

        {/* Для профессионалов - прямая связь как основная кнопка */}
        {isProfessional && (
          <Button 
            onClick={onProceed} 
            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white ${buttonHeight} font-medium order-2`}
            size="default"
          >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            <span>{getDirectContactButtonText()}</span>
          </Button>
        )}
        
        {/* Кнопка отмены */}
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className={`w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${cancelHeight} font-medium order-3`}
          size="default"
        >
          <span>Отмена</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-3 pt-6">
      {/* Кнопка помощника - приоритет для сложных случаев */}
      <Button 
        onClick={onAssistantContact}
        className={`flex-1 ${isVeryDifficult ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white ${buttonHeight} font-medium`}
        size="default"
      >
        <HeadphonesIcon className="h-4 w-4 mr-2" />
        <span>{getAssistantButtonText()}</span>
      </Button>
      
      {/* Прямая связь - блокируем для рейтинга 1 */}
      {!isProfessional && !isDirectContactBlocked && (
        <Button 
          onClick={onProceed} 
          variant={isVeryDifficult ? "outline" : "default"}
          className={`flex-1 ${isVeryDifficult ? 'border-green-600 text-green-700 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'} ${buttonHeight} font-medium`}
          size="default"
        >
          {contactType === 'telegram' ? (
            <MessageSquare className="h-4 w-4 mr-2" />
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          <span>{getDirectContactButtonText()}</span>
        </Button>
      )}

      {/* Для профессионалов - прямая связь как основная кнопка */}
      {isProfessional && (
        <Button 
          onClick={onProceed} 
          className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white ${buttonHeight} font-medium`}
          size="default"
        >
          {contactType === 'telegram' ? (
            <MessageSquare className="h-4 w-4 mr-2" />
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          <span>{getDirectContactButtonText()}</span>
        </Button>
      )}
      
      {/* Кнопка отмены */}
      <Button 
        variant="ghost" 
        onClick={onCancel}
        className={`w-auto text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${buttonHeight} font-medium px-6`}
        size="default"
      >
        <span>Отмена</span>
      </Button>
    </div>
  );
};
