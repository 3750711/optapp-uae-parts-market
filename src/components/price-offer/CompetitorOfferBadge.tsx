
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitorOfferBadgeProps {
  maxOtherOffer: number;
  compact?: boolean;
  isUserLeading?: boolean;
  userOfferPrice?: number;
  recentUpdate?: boolean;
}

export const CompetitorOfferBadge: React.FC<CompetitorOfferBadgeProps> = ({ 
  maxOtherOffer, 
  compact = false, 
  isUserLeading = false,
  userOfferPrice = 0,
  recentUpdate = false
}) => {
  console.log('🏷️ CompetitorOfferBadge render:', { 
    maxOtherOffer, 
    compact, 
    isUserLeading,
    userOfferPrice,
    recentUpdate
  });
  
  // Calculate the actual competing offer
  const competingOffer = isUserLeading 
    ? (maxOtherOffer > 0 && maxOtherOffer < userOfferPrice ? maxOtherOffer : 0)
    : maxOtherOffer;

  // Hide badge if no meaningful competing offer
  if (!competingOffer || competingOffer <= 0) {
    console.log('🏷️ Badge hidden - no competing offer');
    return null;
  }

  if (compact) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all duration-200",
          "bg-gradient-to-r from-orange-100 to-amber-50 text-orange-700 border border-orange-200/60",
          recentUpdate && "animate-pulse scale-110"
        )}
      >
        <Users className="h-3 w-3" />
        <span>${competingOffer}</span>
      </Badge>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg text-sm transition-all duration-200",
      "bg-gradient-to-r from-orange-50 to-amber-25 text-orange-700 border border-orange-200/60",
      recentUpdate && "animate-pulse ring-2 ring-orange-400 ring-opacity-50"
    )}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        <span className="font-medium">Конкурирующая ставка</span>
      </div>
      <span className="font-bold">${competingOffer}</span>
    </div>
  );
};
