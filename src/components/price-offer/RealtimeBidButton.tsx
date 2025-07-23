
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import bidIcon from '@/assets/bid-icon.png';

interface RealtimeBidButtonProps {
  isLeadingBid: boolean;
  hasUserOffer: boolean;
  userOfferPrice: number;
  maxOtherOffer: number;
  compact: boolean;
  onClick: (e: React.MouseEvent) => void;
  priceAnimation: boolean;
  recentUpdate: boolean;
}

const BidIcon = React.memo(({ className }: { className?: string }) => (
  <img 
    src={bidIcon} 
    alt="Bid" 
    className={className}
    style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(119%) contrast(119%)' }}
  />
));

export const RealtimeBidButton: React.FC<RealtimeBidButtonProps> = ({
  isLeadingBid,
  hasUserOffer,
  userOfferPrice,
  maxOtherOffer,
  compact,
  onClick,
  priceAnimation,
  recentUpdate
}) => {
  console.log('🎯 RealtimeBidButton render:', {
    isLeadingBid,
    hasUserOffer,
    userOfferPrice,
    maxOtherOffer
  });

  // Determine button style based on user's bidding status
  const getButtonStyle = () => {
    if (hasUserOffer && userOfferPrice > 0) {
      if (isLeadingBid) {
        // Green for leading bid
        return {
          className: cn(
            "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg",
            "hover:shadow-xl transform hover:scale-105 transition-all duration-200",
            priceAnimation && "animate-pulse scale-110",
            recentUpdate && "ring-2 ring-green-400 ring-opacity-50"
          ),
          icon: TrendingUp,
          label: compact ? 'лидер' : 'лидирую',
          price: userOfferPrice
        };
      } else {
        // Yellow for trailing bid
        return {
          className: cn(
            "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg",
            "hover:shadow-xl transform hover:scale-105 transition-all duration-200",
            priceAnimation && "animate-pulse scale-110",
            recentUpdate && "ring-2 ring-yellow-400 ring-opacity-50"
          ),
          icon: Clock,
          label: compact ? 'обновить' : 'повысить',
          price: userOfferPrice
        };
      }
    } else {
      // Blue for new bid
      return {
        className: cn(
          "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg",
          "hover:shadow-xl transform hover:scale-105 transition-all duration-200",
          recentUpdate && "ring-2 ring-blue-400 ring-opacity-50"
        ),
        icon: Zap,
        label: compact ? 'ставка' : 'сделать ставку',
        price: null
      };
    }
  };

  const buttonStyle = getButtonStyle();
  const IconComponent = buttonStyle.icon;

  if (compact) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center h-10 min-w-[80px] px-3 rounded-full",
          buttonStyle.className
        )}
        title={`${isLeadingBid ? 'Лидирующее предложение' : hasUserOffer ? 'Ваше предложение' : 'Сделать ставку'}: ${buttonStyle.price ? `$${buttonStyle.price}` : 'Новая ставка'}`}
      >
        <div className="flex items-center gap-1">
          <IconComponent className="h-3 w-3" />
          {buttonStyle.price ? (
            <span className="text-xs font-bold">${buttonStyle.price}</span>
          ) : (
            <BidIcon className="h-3 w-3" />
          )}
        </div>
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full h-10 text-sm px-4",
        buttonStyle.className
      )}
    >
      <IconComponent className="h-4 w-4" />
      {buttonStyle.price ? (
        <span className="font-semibold">${buttonStyle.price}</span>
      ) : (
        <BidIcon className="h-4 w-4" />
      )}
      <span className="text-sm opacity-90 ml-auto">
        {buttonStyle.label}
      </span>
    </Button>
  );
};
