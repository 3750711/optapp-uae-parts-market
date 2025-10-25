import React from 'react';
import { Lock, ShoppingCart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { authPrompt } from '@/utils/translations/authPrompt';
import { Lang } from '@/types/i18n';
import { Product } from '@/types/product';

interface BlurredPriceSectionProps {
  product: Product;
  language: Lang;
  onLogin: () => void;
}

export const BlurredPriceSection: React.FC<BlurredPriceSectionProps> = ({
  product,
  language,
  onLogin
}) => {
  const t = authPrompt[language];

  return (
    <div className="bg-card rounded-lg shadow-md p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t.sellerInfo}</h2>
      </div>

      {/* Blurred Price */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mb-6 cursor-help">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">{t.loginToSeePrice}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold blur-[6px] select-none text-muted-foreground">
                  $999.99
                </span>
              </div>
              {product.delivery_price && product.delivery_price > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t.delivery} <span className="blur-[4px] select-none">$99.99</span>
                </p>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.priceTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Disabled Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button
          disabled
          className="w-full opacity-60 cursor-not-allowed"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {t.addToCart}
        </Button>
        <Button
          disabled
          variant="outline"
          className="w-full opacity-60 cursor-not-allowed"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {t.makeOffer}
        </Button>
        
        {/* Login CTA */}
        <Button
          onClick={onLogin}
          className="w-full mt-2"
          variant="default"
        >
          <Lock className="h-4 w-4 mr-2" />
          {t.loginButton}
        </Button>
      </div>
    </div>
  );
};
