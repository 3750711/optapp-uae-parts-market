
import React from 'react';
import { PriceOffer } from '@/types/price-offer';
import { cn } from '@/lib/utils';
import { Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface OfferStatusIndicatorProps {
  currentOffer: PriceOffer;
  isLeading: boolean;
  maxOtherOffer: number;
  timeLeft: string | null;
}

export const OfferStatusIndicator: React.FC<OfferStatusIndicatorProps> = ({
  currentOffer,
  isLeading,
  maxOtherOffer,
  timeLeft
}) => {
  const getStatusColor = () => {
    if (isLeading) return 'bg-green-50 border-green-200';
    return 'bg-orange-50 border-orange-200';
  };

  const getStatusIcon = () => {
    if (isLeading) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertCircle className="w-4 h-4 text-orange-600" />;
  };

  const getStatusText = () => {
    if (isLeading) return 'Ваше предложение лидирует';
    return 'Есть предложения выше';
  };

  const getStatusTextColor = () => {
    if (isLeading) return 'text-green-800';
    return 'text-orange-800';
  };

  return (
    <div className={cn("p-4 rounded-lg border-2", getStatusColor())}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={cn("text-sm font-medium", getStatusTextColor())}>
            {getStatusText()}
          </span>
        </div>
        {timeLeft && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">{timeLeft}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Ваше предложение:</span>
          <span className="font-semibold">${currentOffer.offered_price}</span>
        </div>
        
        {maxOtherOffer > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Максимальное предложение:</span>
            <span className="font-semibold">${maxOtherOffer}</span>
          </div>
        )}
      </div>
      
      {!isLeading && maxOtherOffer > 0 && (
        <div className="mt-2 p-2 bg-white rounded border">
          <p className="text-xs text-gray-600">
            Предложите больше ${maxOtherOffer} чтобы стать лидером
          </p>
        </div>
      )}
    </div>
  );
};
