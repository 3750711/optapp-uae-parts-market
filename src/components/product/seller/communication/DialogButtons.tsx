
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

  const buttonHeight = isMobile ? "h-9" : "h-10";

  // Определяем тексты кнопок
  const getAssistantButtonText = () => {
    if (isVeryDifficult) {
      return isMobile ? 'Помощник сайта' : 'Задать вопрос помощнику сайта';
    }
    return isMobile ? 'Помощник сайта' : 'Задать вопрос помощнику сайта';
  };

  const getDirectContactButtonText = () => {
    if (isProfessional) {
      return isMobile 
        ? `${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`
        : `Написать профессионалу в ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`;
    }
    return isMobile
      ? `${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`
      : `Написать продавцу в ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`;
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 p-3 w-full">
        {/* Кнопка помощника - показываем всегда */}
        <Button 
          onClick={onAssistantContact}
          className={`w-full ${isVeryDifficult ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white ${buttonHeight} font-medium text-sm`}
          size="sm"
        >
          <HeadphonesIcon className="h-4 w-4 mr-2" />
          <span>{getAssistantButtonText()}</span>
        </Button>
        
        {/* Прямая связь - блокируем для рейтинга 1 */}
        {!isProfessional && !isDirectContactBlocked && (
          <Button 
            onClick={onProceed} 
            variant={isVeryDifficult ? "outline" : "default"}
            className={`w-full ${isVeryDifficult ? 'border-green-600 text-green-700 hover:bg-green-50' : 'bg-green-600 hover:bg-green-700 text-white'} ${buttonHeight} font-medium text-sm`}
            size="sm"
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
            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white ${buttonHeight} font-medium text-sm`}
            size="sm"
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
          className={`w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 h-8 font-medium text-sm`}
          size="sm"
        >
          <span>Отмена</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-3 p-4">
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
