
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
  // Determine the maximum bid to show
  const maxBid = Math.max(maxOtherOffer, userOfferPrice);
  
  // Don't show if no bids exist
  if (maxBid <= 0) return null;

  const isUserMax = hasUserOffer && userOfferPrice >= maxOtherOffer;

  if (compact) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all duration-200",
          isUserMax 
            ? "bg-green-100 text-green-800 border-green-200" 
            : "bg-orange-100 text-orange-800 border-orange-200"
        )}
      >
        {isUserMax ? (
          <Crown className="h-3 w-3" />
        ) : (
          <TrendingUp className="h-3 w-3" />
        )}
        <span>макс ${maxBid}</span>
      </Badge>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg text-sm transition-all duration-200",
      isUserMax 
        ? "bg-green-50 text-green-800 border border-green-200" 
        : "bg-orange-50 text-orange-800 border border-orange-200"
    )}>
      <div className="flex items-center gap-2">
        {isUserMax ? (
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
      <span className="font-bold">${maxBid}</span>
    </div>
  );
};
