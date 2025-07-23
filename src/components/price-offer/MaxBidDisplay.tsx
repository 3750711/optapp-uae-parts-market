
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaxBidDisplayProps {
  maxOtherOffer: number;
  isUserLeading: boolean;
  compact: boolean;
  hasUserOffer: boolean;
  userOfferPrice: number;
}

export const MaxBidDisplay: React.FC<MaxBidDisplayProps> = ({
  maxOtherOffer,
  isUserLeading,
  compact,
  hasUserOffer,
  userOfferPrice
}) => {
  // Determine what to show as the "max bid"
  const displayPrice = isUserLeading && hasUserOffer ? userOfferPrice : maxOtherOffer;
  const displayLabel = isUserLeading && hasUserOffer ? 'Ваша ставка' : 'макс';
  
  console.log('🏷️ MaxBidDisplay:', {
    maxOtherOffer,
    isUserLeading,
    hasUserOffer,
    userOfferPrice,
    displayPrice,
    displayLabel
  });
  
  // Don't show if no meaningful bid exists
  if (displayPrice <= 0) return null;

  if (compact) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all duration-200",
          isUserLeading && hasUserOffer
            ? "bg-green-100 text-green-800 border-green-200" 
            : "bg-orange-100 text-orange-800 border-orange-200"
        )}
      >
        {isUserLeading && hasUserOffer ? (
          <Crown className="h-3 w-3" />
        ) : (
          <TrendingUp className="h-3 w-3" />
        )}
        <span>{displayLabel} ${displayPrice}</span>
      </Badge>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg text-sm transition-all duration-200",
      isUserLeading && hasUserOffer
        ? "bg-green-50 text-green-800 border border-green-200" 
        : "bg-orange-50 text-orange-800 border border-orange-200"
    )}>
      <div className="flex items-center gap-2">
        {isUserLeading && hasUserOffer ? (
          <>
            <Crown className="h-4 w-4" />
            <span className="font-medium">Ваша ставка лидирует</span>
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Максимальная ставка</span>
          </>
        )}
      </div>
      <span className="font-bold">${displayPrice}</span>
    </div>
  );
};
