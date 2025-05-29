
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, User } from "lucide-react";
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

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 p-4 pt-3 border-t bg-white sticky bottom-0">
        {/* Кнопка помощника - показываем всегда */}
        <Button 
          onClick={onAssistantContact}
          className={`w-full ${isVeryDifficult ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white ${buttonHeight} font-medium order-1`}
          size="default"
        >
          <User className="h-4 w-4 mr-2" />
          <span>{isVeryDifficult ? 'Связаться через помощника' : 'Помощник partsbay.ae'}</span>
        </Button>
        
        {/* Прямая связь - блокируем для рейтинга 1 */}
        {!isProfessional && !isDirectContactBlocked && (
          <Button 
            onClick={onProceed} 
            variant={isVeryDifficult ? "outline" : "default"}
            className={`w-full ${buttonHeight} font-medium order-2`}
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
            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white ${buttonHeight} font-medium order-2`}
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
          onClick={onCancel}
          className={`w-full text-gray-600 hover:text-gray-800 ${cancelHeight} font-medium order-3`}
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
        className={`flex-1 ${isVeryDifficult ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white ${buttonHeight} font-medium`}
        size="default"
      >
        <User className="h-4 w-4 mr-2" />
        <span>{isVeryDifficult ? 'Связаться через помощника' : 'Помощник partsbay.ae'}</span>
      </Button>
      
      {/* Прямая связь - блокируем для рейтинга 1 */}
      {!isProfessional && !isDirectContactBlocked && (
        <Button 
          onClick={onProceed} 
          variant={isVeryDifficult ? "outline" : "default"}
          className={`flex-1 ${buttonHeight} font-medium`}
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
          className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white ${buttonHeight} font-medium`}
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
        onClick={onCancel}
        className={`w-auto text-gray-600 hover:text-gray-800 ${buttonHeight} font-medium px-6`}
        size="default"
      >
        <span>Отмена</span>
      </Button>
    </div>
  );
};
