
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    return 'Помощник';
  };

  const getDirectContactButtonText = () => {
    return contactType === 'telegram' ? 'Telegram' : 'WhatsApp';
  };

  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="p-3 space-y-2">
          {/* Кнопка помощника с подсказкой */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onAssistantContact}
                className="w-full h-10"
                variant={isVeryDifficult ? "destructive" : "default"}
              >
                <HeadphonesIcon className="h-4 w-4 mr-2" />
                {getAssistantButtonText()}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Менеджер поможет договориться</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Прямая связь с подсказкой */}
          {!isDirectContactBlocked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={onProceed} 
                  className="w-full h-10"
                  variant="outline"
                >
                  {contactType === 'telegram' ? (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  {getDirectContactButtonText()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Напрямую с продавцем</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Кнопка отмены */}
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="w-full h-8 text-gray-500"
            size="sm"
          >
            Отмена
          </Button>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-3 flex gap-2">
        {/* Кнопка помощника с подсказкой */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onAssistantContact}
              className="flex-1 h-10"
              variant={isVeryDifficult ? "destructive" : "default"}
            >
              <HeadphonesIcon className="h-4 w-4 mr-2" />
              {getAssistantButtonText()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Менеджер поможет договориться</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Прямая связь с подсказкой */}
        {!isDirectContactBlocked && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onProceed} 
                className="flex-1 h-10"
                variant="outline"
              >
                {contactType === 'telegram' ? (
                  <MessageSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                {getDirectContactButtonText()}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Напрямую с продавцем</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Кнопка отмены */}
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="px-4 h-10 text-gray-500"
        >
          Отмена
        </Button>
      </div>
    </TooltipProvider>
  );
};
