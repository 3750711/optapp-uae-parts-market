
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
  validation?: {
    canContactDirect: boolean;
    availableContacts: ('telegram' | 'whatsapp')[];
    hasValidContacts: boolean;
    fallbackToManager: boolean;
    validationErrors: string[];
  };
}

export const DialogButtons: React.FC<DialogButtonsProps> = ({
  onAssistantContact,
  onProceed,
  onCancel,
  communicationRating,
  contactType,
  isMobile = false,
  validation
}) => {
  const isProfessional = communicationRating === 5;
  const isVeryDifficult = communicationRating === 1 || communicationRating === 2;
  const isDirectContactBlocked = communicationRating === 1 || !validation?.canContactDirect;

  const getAssistantButtonText = () => {
    return 'Менеджер';
  };

  const getDirectContactButtonText = () => {
    if (!validation?.canContactDirect) {
      return 'Недоступно';
    }
    return contactType === 'telegram' ? 'Telegram' : 'WhatsApp';
  };

  if (isMobile) {
    return (
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
          <TooltipContent 
            side="top" 
            align="center"
            className="text-xs max-w-[200px] text-center"
            sideOffset={8}
          >
            <p>Менеджер поможет договориться</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Прямая связь */}
        {!isDirectContactBlocked && (
          <Button 
            onClick={onProceed} 
            className="w-full h-10"
            variant="outline"
            disabled={!validation?.canContactDirect}
          >
              {contactType === 'telegram' ? (
                <MessageSquare className="h-4 w-4 mr-2" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              {getDirectContactButtonText()}
            </Button>
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
    );
  }

  return (
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
        <TooltipContent 
          side="top" 
          align="center"
          className="text-sm"
          sideOffset={5}
        >
          <p>Менеджер поможет договориться</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Прямая связь */}
      {!isDirectContactBlocked && (
        <Button 
          onClick={onProceed} 
          className="flex-1 h-10"
          variant="outline"
          disabled={!validation?.canContactDirect}
        >
            {contactType === 'telegram' ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            {getDirectContactButtonText()}
          </Button>
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
  );
};
