
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
    return `Написать в ${contactType === 'telegram' ? 'Telegram' : 'WhatsApp'}`;
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {/* Кнопка помощника */}
        <Button 
          onClick={onAssistantContact}
          className="w-full h-11 font-semibold text-sm rounded-lg"
          variant={isVeryDifficult ? "destructive" : "default"}
          size="lg"
        >
          <HeadphonesIcon className="h-4 w-4 mr-2" />
          <span>{getAssistantButtonText()}</span>
        </Button>
        
        {/* Прямая связь */}
        {!isProfessional && !isDirectContactBlocked && (
          <Button 
            onClick={onProceed} 
            className="w-full h-11 font-semibold text-sm rounded-lg"
            variant={isVeryDifficult ? "outline" : "secondary"}
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
            className="w-full h-11 font-semibold text-sm rounded-lg"
            variant="secondary"
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
          className="w-full h-9 font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
          size="sm"
        >
          Отмена
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 p-4">
      {/* Кнопка помощника */}
      <Button 
        onClick={onAssistantContact}
        className="flex-1 h-10 font-semibold text-sm rounded-lg"
        variant={isVeryDifficult ? "destructive" : "default"}
        size="lg"
      >
        <HeadphonesIcon className="h-4 w-4 mr-2" />
        <span>{getAssistantButtonText()}</span>
      </Button>
      
      {/* Прямая связь */}
      {!isProfessional && !isDirectContactBlocked && (
        <Button 
          onClick={onProceed} 
          className="flex-1 h-10 font-semibold text-sm rounded-lg"
          variant={isVeryDifficult ? "outline" : "secondary"}
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
          className="flex-1 h-10 font-semibold text-sm rounded-lg"
          variant="secondary"
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
        className="w-auto h-10 font-medium px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
        size="lg"
      >
        Отмена
      </Button>
    </div>
  );
};
