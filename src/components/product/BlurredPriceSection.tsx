import React from 'react';
import { ShoppingCart, MessageSquare, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BlurredPrice } from './BlurredDataComponents';
import { getAuthPromptTranslations } from '@/utils/translations/authPrompt';
import { Database } from '@/integrations/supabase/types';

interface BlurredPriceSectionProps {
  product: {
    title: string;
    category?: string;
    delivery_price?: number | null;
  };
  language: 'ru' | 'en' | 'bn';
  deliveryMethod: Database["public"]["Enums"]["delivery_method"];
}

export const BlurredPriceSection: React.FC<BlurredPriceSectionProps> = ({
  product,
  language,
  deliveryMethod
}) => {
  const t = getAuthPromptTranslations(language);

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
        {product.category && (
          <p className="text-sm text-muted-foreground">{product.category}</p>
        )}
      </div>

      <div className="space-y-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-3 cursor-help">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <BlurredPrice showLabel={false} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.loginToSeePrice}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {product.delivery_price !== null && product.delivery_price !== undefined && (
          <div className="text-sm text-muted-foreground">
            <span>Доставка: </span>
            <span className="font-medium">{product.delivery_price} AED</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  В корзину
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.loginToSee}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  disabled
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Сделать предложение
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t.loginToSee}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>{t.loginToSeePrice}</span>
        </div>
      </div>
    </Card>
  );
};
