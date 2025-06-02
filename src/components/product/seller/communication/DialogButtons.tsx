
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, HeadphonesIcon } from "lucide-react";

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
  isMobile = false
}) => {
  const isProfessional = communicationRating === 5;
  const isVeryDifficult = communicationRating === 1 || communicationRating === 2;
  const isDirectContactBlocked = communicationRating === 1;

  const getAssistantButtonText = () => {
    return isMobile ? 'Помощник' : 'Задать вопрос помощнику';
  };

  const getDirectContactButtonText = () => {
    if (isMobile) {
      return contactType === 'telegram' ? 'Telegram' : 'WhatsApp';
    }
    
    if (isProfessional) {
      return `Написать в ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`;
    }
    return `Написать в ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`;
  };

  const getAssistantButtonStyle = () => {
    if (isVeryDifficult) {
      return "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95";
    }
    return "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95";
  };

  const getDirectContactButtonStyle = () => {
    if (isProfessional) {
      return "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95";
    }
    if (isVeryDifficult) {
      return "bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 shadow-md transform transition-all duration-200 hover:scale-105 active:scale-95";
    }
    return "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95";
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {/* Кнопка помощника */}
        <Button 
          onClick={onAssistantContact}
          className={`w-full h-12 font-semibold text-sm rounded-xl ${getAssistantButtonStyle()}`}
          size="lg"
        >
          <HeadphonesIcon className="h-4 w-4 mr-2" />
          <span>{getAssistantButtonText()}</span>
        </Button>
        
        {/* Прямая связь */}
        {!isProfessional && !isDirectContactBlocked && (
          <Button 
            onClick={onProceed} 
            className={`w-full h-12 font-semibold text-sm rounded-xl ${getDirectContactButtonStyle()}`}
            size="lg"
          >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            <span>{getDirectContactButtonText()}</span>
          </Button>
        )}

        {/* Для профессионалов */}
        {isProfessional && (
          <Button 
            onClick={onProceed} 
            className={`w-full h-12 font-semibold text-sm rounded-xl ${getDirectContactButtonStyle()}`}
            size="lg"
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
          className="w-full h-10 font-medium text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
          size="sm"
        >
          Отмена
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-3 p-5">
      {/* Кнопка помощника */}
      <Button 
        onClick={onAssistantContact}
        className={`flex-1 h-11 font-semibold text-sm rounded-xl ${getAssistantButtonStyle()}`}
        size="lg"
      >
        <HeadphonesIcon className="h-4 w-4 mr-2" />
        <span>{getAssistantButtonText()}</span>
      </Button>
      
      {/* Прямая связь */}
      {!isProfessional && !isDirectContactBlocked && (
        <Button 
          onClick={onProceed} 
          className={`flex-1 h-11 font-semibold text-sm rounded-xl ${getDirectContactButtonStyle()}`}
          size="lg"
        >
          {contactType === 'telegram' ? (
            <MessageSquare className="h-4 w-4 mr-2" />
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          <span>{getDirectContactButtonText()}</span>
        </Button>
      )}

      {/* Для профессионалов */}
      {isProfessional && (
        <Button 
          onClick={onProceed} 
          className={`flex-1 h-11 font-semibold text-sm rounded-xl ${getDirectContactButtonStyle()}`}
          size="lg"
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
        className="w-auto h-11 font-medium px-6 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
        size="lg"
      >
        Отмена
      </Button>
    </div>
  );
};
