
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Heart, MoreHorizontal, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { SimpleMakeOfferButton } from '@/components/price-offer/SimpleMakeOfferButton';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';

interface SimpleOfferCardProps {
  product: Product & {
    user_offer_price?: number;
    user_offer_status?: string;
    user_offer_expires_at?: string;
    user_offer_seller_response?: string;
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
    if (!product.user_offer_expires_at || product.user_offer_status !== 'pending') return;

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
  }, [product.user_offer_expires_at, product.user_offer_status]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Активное
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Принято
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Отклонено
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Истекло
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusDescription = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает ответа продавца';
      case 'accepted':
        return 'Продавец принял ваше предложение';
      case 'rejected':
        return 'Продавец отклонил предложение';
      case 'expired':
        return 'Срок действия предложения истек';
      default:
        return '';
    }
  };

  const primaryImage = product.product_images?.find(img => img.is_primary) 
    || product.product_images?.[0];

  const canMakeNewOffer = product.user_offer_status === 'rejected' || product.user_offer_status === 'expired';

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${
      isRecentUpdate ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    }`}>
      <CardContent className="p-4">
        {/* Product Image */}
        {primaryImage && (
          <div className="mb-4">
            <img 
              src={primaryImage.url} 
              alt={product.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

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

        {/* Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {getStatusBadge(product.user_offer_status)}
            
            {product.user_offer_expires_at && product.user_offer_status === 'pending' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{timeLeft}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {getStatusDescription(product.user_offer_status)}
          </p>
          
          {/* Seller Response */}
          {product.user_offer_status === 'rejected' && product.user_offer_seller_response && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs font-medium text-red-800 mb-1">Ответ продавца:</p>
              <p className="text-xs text-red-700">{product.user_offer_seller_response}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <SimpleMakeOfferButton 
            product={product}
            compact={false}
          />
          
          {canMakeNewOffer && (
            <p className="text-xs text-muted-foreground text-center">
              Вы можете сделать новое предложение
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
