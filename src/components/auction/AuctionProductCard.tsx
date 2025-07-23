
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  Heart,
  DollarSign,
  Activity
} from 'lucide-react';
import { Product } from '@/types/product';
import { useCreatePriceOffer } from '@/hooks/use-price-offers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AuctionProductCardProps {
  product: Product & {
    user_offer_price?: number;
    user_offer_status?: string;
    user_offer_expires_at?: string;
    max_other_offer?: number;
    is_user_leading?: boolean;
    offers_count?: number;
  };
  lastUpdateTime?: Date;
  onFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export const AuctionProductCard: React.FC<AuctionProductCardProps> = ({
  product,
  lastUpdateTime,
  onFavorite,
  isFavorite = false
}) => {
  const [isRecentUpdate, setIsRecentUpdate] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const createOfferMutation = useCreatePriceOffer();

  const isLeading = product.is_user_leading || false;
  const userPrice = product.user_offer_price || 0;
  const maxOtherPrice = product.max_other_offer || 0;
  const currentMaxPrice = Math.max(userPrice, maxOtherPrice);
  const totalOffers = product.offers_count || 0;

  // Handle recent updates animation
  useEffect(() => {
    if (lastUpdateTime) {
      setIsRecentUpdate(true);
      const timer = setTimeout(() => setIsRecentUpdate(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTime]);

  // Calculate time remaining
  useEffect(() => {
    if (!product.user_offer_expires_at) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(product.user_offer_expires_at!).getTime();
      const diff = expiry - now;
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`);
      } else {
        setTimeLeft('Истекло');
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [product.user_offer_expires_at]);

  const handleQuickBid = async (amount: number) => {
    const newBidAmount = currentMaxPrice + amount;
    
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
      toast.error('Ошибка при размещении ставки');
    }
  };

  const formatPrice = (price: number) => `$${price.toLocaleString()}`;

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden",
      isRecentUpdate && "ring-2 ring-blue-400 shadow-blue-100",
      isLeading ? "border-green-300 bg-green-50/30" : "border-orange-300 bg-orange-50/30"
    )}>
      {/* Recent update indicator */}
      {isRecentUpdate && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
            <Activity className="h-3 w-3" />
            <span>Обновлено</span>
          </div>
        </div>
      )}

      {/* Leader status indicator */}
      {userPrice > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <Badge 
            variant={isLeading ? "default" : "destructive"}
            className={cn(
              "font-medium",
              isLeading ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"
            )}
          >
            {isLeading ? (
              <>
                <Trophy className="h-3 w-3 mr-1" />
                Лидируете
              </>
            ) : (
              <>
                <TrendingUp className="h-3 w-3 mr-1" />
                Отстаёте
              </>
            )}
          </Badge>
        </div>
      )}

      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
          {product.product_images?.[0]?.url ? (
            <img 
              src={product.product_images[0].url} 
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">Нет фото</span>
            </div>
          )}
          
          {/* Favorite button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(product.id);
            }}
          >
            <Heart 
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
              )} 
            />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Product Info */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
            <p className="text-sm text-muted-foreground">{product.brand} {product.model}</p>
          </div>

          {/* Price Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Текущая цена:</span>
              <span className="text-xl font-bold">{formatPrice(currentMaxPrice)}</span>
            </div>
            
            {userPrice > 0 && (
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                isLeading ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
              )}>
                <span className="text-sm font-medium">Ваша ставка:</span>
                <span className="font-semibold">{formatPrice(userPrice)}</span>
              </div>
            )}
            
            {maxOtherPrice > 0 && maxOtherPrice !== userPrice && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Конкурентная ставка:</span>
                <span className="font-medium">{formatPrice(maxOtherPrice)}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{totalOffers} ставок</span>
            </div>
            {timeLeft && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeLeft}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {userPrice > 0 && product.user_offer_status === 'pending' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {[10, 25, 50].map((amount) => (
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
              
              <Button
                className={cn(
                  "w-full",
                  isLeading 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-orange-600 hover:bg-orange-700"
                )}
                disabled={createOfferMutation.isPending}
              >
                {createOfferMutation.isPending ? 'Размещение...' : 'Поднять ставку'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
