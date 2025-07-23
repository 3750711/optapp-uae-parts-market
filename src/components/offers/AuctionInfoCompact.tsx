
import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Users, Activity } from 'lucide-react';
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
  lastUpdateTime
}) => {
  const createOfferMutation = useCreatePriceOffer();
  const [componentUpdateTime, setComponentUpdateTime] = useState<Date>(new Date());

  // Debug logging to track data changes
  useEffect(() => {
    console.log('🎯 AuctionInfoCompact data update:', {
      productId,
      userOfferPrice,
      maxCompetitorPrice,
      isUserLeading,
      totalOffers,
      lastUpdateTime: lastUpdateTime?.toISOString(),
      componentUpdateTime: componentUpdateTime.toISOString()
    });
  }, [productId, userOfferPrice, maxCompetitorPrice, isUserLeading, totalOffers, lastUpdateTime, componentUpdateTime]);

  // Update component timestamp when lastUpdateTime changes
  useEffect(() => {
    if (lastUpdateTime) {
      setComponentUpdateTime(new Date());
      console.log('⏰ AuctionInfoCompact: lastUpdateTime changed to:', lastUpdateTime.toISOString());
    }
  }, [lastUpdateTime]);

  // Memoized calculations that react to data changes
  const { 
    isRecentUpdate, 
    competitorDifference, 
    timeRemaining,
    formattedUserPrice,
    formattedMaxPrice
  } = useMemo(() => {
    const now = Date.now();
    const recentThreshold = 10000; // 10 seconds
    
    // Check if update is recent based on lastUpdateTime
    const isRecent = lastUpdateTime && (now - lastUpdateTime.getTime()) < recentThreshold;
    
    // Calculate competitor difference
    const difference = Math.max(0, maxCompetitorPrice - userOfferPrice);
    
    // Calculate time remaining
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now;
    let timeStr = 'Истекло';
    
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        timeStr = `${hours}ч ${minutes}м`;
      } else {
        timeStr = `${minutes}м`;
      }
    }
    
    // Format prices
    const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);
    
    console.log('💡 AuctionInfoCompact calculations:', {
      isRecent,
      difference,
      timeStr,
      lastUpdateTime: lastUpdateTime?.toISOString(),
      timeSinceUpdate: lastUpdateTime ? now - lastUpdateTime.getTime() : 'N/A'
    });
    
    return {
      isRecentUpdate: isRecent,
      competitorDifference: difference,
      timeRemaining: timeStr,
      formattedUserPrice: formatPrice(userOfferPrice),
      formattedMaxPrice: formatPrice(maxCompetitorPrice)
    };
  }, [userOfferPrice, maxCompetitorPrice, expiresAt, lastUpdateTime]);

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
      
      toast.success(`Ставка поднята до $${new Intl.NumberFormat('ru-RU').format(newBidAmount)}`);
    } catch (error) {
      console.error('Error placing quick bid:', error);
      toast.error('Ошибка при размещении ставки');
    }
  };

  return (
    <div className={`rounded-lg p-3 space-y-2 border transition-all duration-500 ${
      isRecentUpdate 
        ? 'bg-green-50 border-green-200 shadow-sm ring-1 ring-green-300' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Status and prices */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isUserLeading ? "default" : "destructive"} className="text-xs">
            {isUserLeading ? 'Лидирую' : 'Отстаю'}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="h-3 w-3" />
            <span>{totalOffers} ставок</span>
          </div>
          {isRecentUpdate && (
            <div className="flex items-center gap-1 animate-pulse">
              <Activity className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Обновлено</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Price comparison */}
      <div className="flex items-center justify-between text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Моя ставка:</span>
            <span className="font-medium">${formattedUserPrice}</span>
          </div>
          {!isUserLeading && maxCompetitorPrice > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Лидер:</span>
              <span className="font-medium text-red-600">
                ${formattedMaxPrice}
              </span>
              {competitorDifference > 0 && (
                <span className="text-xs text-gray-500">
                  (+${new Intl.NumberFormat('ru-RU').format(competitorDifference)})
                </span>
              )}
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
        <div className="text-xs text-gray-400">
          Обновлено: {lastUpdateTime.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      )}
    </div>
  );
};
