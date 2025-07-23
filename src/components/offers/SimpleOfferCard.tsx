import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Heart, MoreHorizontal } from 'lucide-react';
import { SimpleMakeOfferButton } from '@/components/price-offer/SimpleMakeOfferButton';
import { Product } from '@/types/product';

interface SimpleOfferCardProps {
  product: Product & {
    user_offer_price?: number;
    user_offer_status?: string;
    user_offer_expires_at?: string;
  };
  lastUpdateTime?: Date;
  onFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export const SimpleOfferCard: React.FC<SimpleOfferCardProps> = ({
  product,
  lastUpdateTime,
  onFavorite,
  isFavorite = false
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isRecentUpdate, setIsRecentUpdate] = useState(false);

  useEffect(() => {
    if (lastUpdateTime) {
      const now = new Date().getTime();
      const updateTime = lastUpdateTime.getTime();
      const isRecent = now - updateTime < 5000; // 5 seconds
      setIsRecentUpdate(isRecent);
      
      if (isRecent) {
        const timer = setTimeout(() => setIsRecentUpdate(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastUpdateTime]);

  useEffect(() => {
    if (!product.user_offer_expires_at) return;

    const updateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(product.user_offer_expires_at!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Истекло');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeLeft(`${hours}ч ${minutes}м`);
      } else {
        setTimeLeft(`${minutes}м`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [product.user_offer_expires_at]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ожидает</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Принято</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонено</Badge>;
      case 'expired':
        return <Badge variant="outline">Истекло</Badge>;
      default:
        return null;
    }
  };

  const primaryImage = product.product_images?.find(img => img.is_primary) 
    || product.product_images?.[0];

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${
      isRecentUpdate ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1">
              {product.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {product.brand} {product.model}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {onFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onFavorite(product.id);
                }}
                className="p-2"
              >
                <Heart 
                  className={`h-4 w-4 ${
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  }`} 
                />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="p-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Price Information */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Цена товара:</span>
            <span className="font-semibold">{formatPrice(product.price)}</span>
          </div>
          
          {product.user_offer_price && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ваше предложение:</span>
              <span className="font-bold text-blue-600">
                {formatPrice(product.user_offer_price)}
              </span>
            </div>
          )}
        </div>

        {/* Status and Time */}
        <div className="flex justify-between items-center mb-4">
          <div>
            {getStatusBadge(product.user_offer_status)}
          </div>
          
          {product.user_offer_expires_at && product.user_offer_status === 'pending' && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeLeft}</span>
            </div>
          )}
        </div>

        {/* Offer Button */}
        <SimpleMakeOfferButton 
          product={product}
          compact={false}
        />

        {/* Product Image */}
        {primaryImage && (
          <div className="mt-4">
            <img 
              src={primaryImage.url} 
              alt={product.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};