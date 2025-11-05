import React from 'react';
import { Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { authPrompt } from '@/utils/translations/authPrompt';
import { Lang } from '@/types/i18n';
import { RestrictionBadge } from '@/components/product/RestrictionBadge';

interface BlurredSellerInfoProps {
  sellerName?: string;
  sellerId?: string;
  language: Lang;
  onLogin: () => void;
  userType?: 'guest' | 'seller';
}

export const BlurredSellerInfo: React.FC<BlurredSellerInfoProps> = ({
  sellerName,
  sellerId,
  language,
  onLogin,
  userType = 'guest'
}) => {
  const t = authPrompt[language];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t.sellerInfo}</h3>
        </div>

        {/* Restriction Badge */}
        <RestrictionBadge userType={userType} language={language} />

        {/* Blurred Seller Name */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs text-muted-foreground">{t.loginToSeeSeller}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium blur-[6px] select-none">
                    Seller Name Example
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.sellerTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Blurred Rating */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <p className="text-sm text-muted-foreground mb-1">Рейтинг:</p>
                <div className="flex items-center gap-2">
                  <span className="blur-[6px] select-none text-sm">★★★★★ 4.5</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.sellerTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Blurred OPT ID */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs text-muted-foreground">OPT_ID продавца</span>
                </div>
                <p className="text-sm blur-[6px] select-none font-mono">
                  ABC123XYZ
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.contactTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Contacts Section Header */}
        <div className="pt-2 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {t.sellerContacts}
          </h4>
          
          {/* Blurred Telegram */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-2 cursor-help">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs text-muted-foreground">Telegram:</span>
                  </div>
                  <p className="text-sm blur-[6px] select-none">@username</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.contactTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Blurred Phone */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs text-muted-foreground">Телефон:</span>
                  </div>
                  <p className="text-sm blur-[6px] select-none">+971 XX XXX XXXX</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.contactTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Login CTA */}
        <Button
          onClick={onLogin}
          className="w-full mt-4"
          variant="default"
        >
          <Lock className="h-4 w-4 mr-2" />
          {t.loginButton}
        </Button>
      </div>
    </Card>
  );
};
