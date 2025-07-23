
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Users, Activity, Wifi } from 'lucide-react';
import { useCreatePriceOffer } from '@/hooks/use-price-offers';
import { toast } from 'sonner';

interface AuctionInfoCompactProps {
  productId: string;
  sellerId: string;
  originalPrice: number;
  userOfferPrice: number;
  maxCompetitorPrice: number;
  isUserLeading: boolean;
  totalOffers: number;
  expiresAt: string;
  lastUpdateTime?: Date;
  freshDataIndicator?: boolean;
}

export const AuctionInfoCompact: React.FC<AuctionInfoCompactProps> = ({
  productId,
  sellerId,
  originalPrice,
  userOfferPrice,
  maxCompetitorPrice,
  isUserLeading,
  totalOffers,
  expiresAt,
  lastUpdateTime,
  freshDataIndicator = false
}) => {
  const createOfferMutation = useCreatePriceOffer();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Истекло';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  const handleQuickBid = async () => {
    const newBidAmount = Math.max(maxCompetitorPrice, userOfferPrice) + 5;
    
    try {
      await createOfferMutation.mutateAsync({
        product_id: productId,
        seller_id: sellerId,
        original_price: originalPrice,
        offered_price: newBidAmount,
        message: 'Быстрая ставка +$5'
      });
      
      toast.success(`Ставка поднята до $${formatPrice(newBidAmount)}`);
    } catch (error) {
      console.error('Error placing quick bid:', error);
      toast.error('Ошибка при размещении ставки');
    }
  };

  const competitorDifference = maxCompetitorPrice - userOfferPrice;
  const isFreshData = lastUpdateTime && Date.now() - lastUpdateTime.getTime() < 5000;
  const isVeryFreshData = freshDataIndicator || isFreshData;

  console.log('🎯 AuctionInfoCompact render:', {
    productId,
    userOfferPrice,
    maxCompetitorPrice,
    isUserLeading,
    freshDataIndicator,
    isFreshData,
    isVeryFreshData,
    lastUpdateTime: lastUpdateTime?.toISOString()
  });

  return (
    <div className={`rounded-lg p-3 space-y-2 border transition-all duration-500 ${
      isVeryFreshData ? 'bg-green-50 border-green-200 shadow-md ring-2 ring-green-100' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Status and prices */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant={isUserLeading ? "default" : "destructive"} 
            className={`text-xs transition-all duration-300 ${
              isVeryFreshData ? 'animate-pulse shadow-sm' : ''
            }`}
          >
            {isUserLeading ? 'Лидирую' : 'Отстаю'}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="h-3 w-3" />
            <span>{totalOffers} ставок</span>
          </div>
          {isVeryFreshData && (
            <div className="flex items-center gap-1 animate-pulse">
              <Activity className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Обновлено!</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{getTimeRemaining(expiresAt)}</span>
          </div>
          {/* Connection indicator */}
          <div className={`w-2 h-2 rounded-full ${
            isVeryFreshData ? 'bg-green-500 animate-pulse' : 'bg-green-500'
          }`} title="Real-time обновления" />
        </div>
      </div>

      {/* Price comparison */}
      <div className="flex items-center justify-between text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Моя ставка:</span>
            <span className="font-medium">${formatPrice(userOfferPrice)}</span>
          </div>
          {!isUserLeading && maxCompetitorPrice > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Лидер:</span>
              <span className={`font-medium transition-all duration-300 ${
                isVeryFreshData ? 'text-red-600 animate-pulse' : 'text-red-600'
              }`}>
                ${formatPrice(maxCompetitorPrice)}
              </span>
              <span className="text-xs text-gray-500">
                (+${formatPrice(competitorDifference)})
              </span>
            </div>
          )}
        </div>
        
        {/* Quick bid button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleQuickBid}
          disabled={createOfferMutation.isPending}
          className="flex items-center gap-1 text-xs px-2 py-1 h-7"
        >
          <TrendingUp className="h-3 w-3" />
          {createOfferMutation.isPending ? '...' : `+$5`}
        </Button>
      </div>

      {/* Real-time status */}
      {lastUpdateTime && (
        <div className="text-xs text-gray-400 flex items-center justify-between">
          <span>
            Данные: {lastUpdateTime.toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <span>Live</span>
          </div>
        </div>
      )}
    </div>
  );
};
