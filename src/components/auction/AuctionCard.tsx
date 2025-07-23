
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  Gavel, 
  DollarSign,
  Activity,
  Heart,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';
import { Product } from '@/types/product';
import { useCreatePriceOffer } from '@/hooks/use-price-offers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AuctionCardProps {
  product: Product;
  userOfferPrice?: number;
  maxCompetitorPrice?: number;
  isUserLeading?: boolean;
  totalOffers?: number;
  expiresAt?: string;
  lastUpdateTime?: Date;
  onFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({
  product,
  userOfferPrice = 0,
  maxCompetitorPrice = 0,
  isUserLeading = false,
  totalOffers = 0,
  expiresAt,
  lastUpdateTime,
  onFavorite,
  isFavorite = false
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isRecentUpdate, setIsRecentUpdate] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const createOfferMutation = useCreatePriceOffer();

  // Debug logging with detailed information
  useEffect(() => {
    console.log(`🎯 AuctionCard render for product ${product.id}:`, {
      title: product.title,
      userOfferPrice,
      maxCompetitorPrice,
      isUserLeading,
      totalOffers,
      lastUpdateTime: lastUpdateTime?.toISOString(),
      productStatus: product.status,
      hasActiveOffers: product.has_active_offers
    });
  }, [product.id, userOfferPrice, maxCompetitorPrice, isUserLeading, totalOffers, lastUpdateTime]);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м ${seconds}с`);
        setProgressPercent(Math.min((diff / (6 * 60 * 60 * 1000)) * 100, 100));
      } else {
        setTimeLeft('Завершено');
        setProgressPercent(0);
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Handle recent updates animation
  useEffect(() => {
    if (lastUpdateTime) {
      console.log(`⚡ Recent update detected for product ${product.id}:`, lastUpdateTime.toISOString());
      setIsRecentUpdate(true);
      const timer = setTimeout(() => setIsRecentUpdate(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTime, product.id]);

  const handleQuickBid = async (amount: number) => {
    const newBidAmount = Math.max(maxCompetitorPrice, userOfferPrice) + amount;
    
    console.log(`💰 Quick bid for product ${product.id}:`, {
      currentUserPrice: userOfferPrice,
      currentMaxPrice: maxCompetitorPrice,
      newBidAmount,
      increment: amount
    });
    
    try {
      await createOfferMutation.mutateAsync({
        product_id: product.id,
        seller_id: product.seller_id,
        original_price: product.price,
        offered_price: newBidAmount,
        message: `Быстрая ставка +$${amount}`
      });
      
      toast.success(`Ставка поднята до $${newBidAmount.toLocaleString()}`);
    } catch (error) {
      console.error('❌ Error placing quick bid:', error);
      toast.error('Ошибка при размещении ставки');
    }
  };

  const currentPrice = Math.max(userOfferPrice, maxCompetitorPrice, product.price);
  const priceChange = currentPrice - product.price;
  const priceChangePercent = ((priceChange / product.price) * 100).toFixed(1);

  // Debug information
  const debugInfo = {
    productId: product.id,
    title: product.title,
    userOfferPrice,
    maxCompetitorPrice,
    isUserLeading,
    totalOffers,
    lastUpdate: lastUpdateTime?.toISOString(),
    isRecentUpdate,
    hasActiveOffers: product.has_active_offers
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500 hover:shadow-lg",
      isRecentUpdate && "ring-2 ring-green-400 shadow-green-100",
      isUserLeading ? "border-green-300 bg-green-50/30" : "border-orange-300 bg-orange-50/30"
    )}>
      {/* Recent update indicator */}
      {isRecentUpdate && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
            <Activity className="h-3 w-3" />
            <span>Обновлено</span>
          </div>
        </div>
      )}

      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">
              {product.title}
            </h3>
            <p className="text-sm text-gray-600">
              {product.brand} {product.model}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="p-1 h-8 w-8"
              title="Показать отладочную информацию"
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFavorite?.(product.id)}
              className="p-1 h-8 w-8"
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Debug Information */}
        {showDebugInfo && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
            <div className="font-medium mb-2">Отладочная информация:</div>
            <div className="space-y-1">
              <div>ID: {debugInfo.productId}</div>
              <div>Ваша ставка: ${debugInfo.userOfferPrice}</div>
              <div>Макс. конкурент: ${debugInfo.maxCompetitorPrice}</div>
              <div>Лидер: {debugInfo.isUserLeading ? 'Да' : 'Нет'}</div>
              <div>Всего ставок: {debugInfo.totalOffers}</div>
              <div>Последнее обновление: {debugInfo.lastUpdate || 'Нет'}</div>
              <div>Недавнее обновление: {debugInfo.isRecentUpdate ? 'Да' : 'Нет'}</div>
              <div>Активные предложения: {debugInfo.hasActiveOffers ? 'Да' : 'Нет'}</div>
            </div>
          </div>
        )}

        {/* Price section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ${currentPrice.toLocaleString()}
              </span>
              {priceChange > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  +${priceChange.toLocaleString()} ({priceChangePercent}%)
                </Badge>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Стартовая цена</div>
              <div className="text-lg font-medium text-gray-700">
                ${product.price.toLocaleString()}
              </div>
            </div>
          </div>

          {/* User's bid status */}
          {userOfferPrice > 0 && (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg",
              isUserLeading ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
            )}>
              <div className="flex items-center gap-1">
                {isUserLeading ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  Ваша ставка: ${userOfferPrice.toLocaleString()}
                </span>
              </div>
              <Badge variant={isUserLeading ? "default" : "destructive"} className="text-xs">
                {isUserLeading ? 'Лидер' : 'Отстаёте'}
              </Badge>
            </div>
          )}
          
          {/* Competitor price info */}
          {maxCompetitorPrice > 0 && maxCompetitorPrice !== userOfferPrice && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Конкурентная ставка: ${maxCompetitorPrice.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Time and progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{timeLeft}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{totalOffers} ставок</span>
            </div>
          </div>
          
          <Progress 
            value={progressPercent} 
            className="h-2"
            style={{
              '--progress-background': progressPercent > 50 ? 'hsl(142, 71%, 45%)' : 
                                     progressPercent > 25 ? 'hsl(45, 93%, 47%)' : 
                                     'hsl(0, 84%, 60%)'
            } as React.CSSProperties}
          />
        </div>

        {/* Quick bid buttons */}
        <div className="flex gap-2 mb-4">
          {[5, 10, 25, 50].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => handleQuickBid(amount)}
              disabled={createOfferMutation.isPending}
              className="flex-1 text-xs"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              +{amount}
            </Button>
          ))}
        </div>

        {/* Main bid button */}
        <Button
          className={cn(
            "w-full",
            isUserLeading 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-orange-600 hover:bg-orange-700"
          )}
          disabled={createOfferMutation.isPending}
        >
          <Gavel className="h-4 w-4 mr-2" />
          {createOfferMutation.isPending ? 'Размещение...' : 
           userOfferPrice > 0 ? 'Поднять ставку' : 'Сделать ставку'}
        </Button>

        {/* Product image */}
        {product.product_images && product.product_images.length > 0 && (
          <div className="mt-4">
            <img
              src={product.product_images[0].url}
              alt={product.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
