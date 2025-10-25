import React from 'react';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BlurredSellerName, BlurredRating, BlurredOptId, BlurredTelegram, BlurredPhone } from '../BlurredDataComponents';
import { getAuthPromptTranslations } from '@/utils/translations/authPrompt';

interface BlurredSellerSectionProps {
  language: 'ru' | 'en' | 'bn';
  onShowAuth: () => void;
}

export const BlurredSellerSection: React.FC<BlurredSellerSectionProps> = ({
  language,
  onShowAuth
}) => {
  const t = getAuthPromptTranslations(language);

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Информация о продавце</h3>
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-3 cursor-help">
                <BlurredSellerName />
                <BlurredRating />
                <BlurredOptId />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.loginToSeeSeller}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="pt-4 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Контакты продавца</span>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-2 cursor-help">
                <BlurredTelegram />
                <BlurredPhone />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.loginToSeeContacts}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="pt-4">
        <Button 
          onClick={onShowAuth}
          className="w-full"
          size="lg"
        >
          <Lock className="mr-2 h-5 w-5" />
          {t.loginToSeeContacts}
        </Button>
      </div>
    </Card>
  );
};
