
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { OfferStatusBadge } from '@/components/offers/OfferStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ProductListItemProps {
  product: Product & {
    user_offer_price?: number;
    user_offer_status?: string;
    user_offer_created_at?: string;
    user_offer_expires_at?: string;
  };
  batchOffersData?: any;
  showOfferStatus?: boolean;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ 
  product, 
  batchOffersData,
  showOfferStatus = false 
}) => {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <Link to={`/product/${product.id}`}>
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.title}
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            </Link>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/product/${product.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                >
                  {product.title}
                </Link>
                
                {showOfferStatus && product.user_offer_status && (
                  <div className="flex items-center gap-2 mt-2">
                    <OfferStatusBadge status={product.user_offer_status} />
                    {product.user_offer_status === 'pending' && product.user_offer_expires_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>осталось {getTimeRemaining(product.user_offer_expires_at)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-1 ml-4">
                <Badge variant="outline" className="text-xs">
                  Лот #{product.lot_number}
                </Badge>
                {product.status === 'sold' && (
                  <Badge variant="destructive" className="text-xs">
                    Продано
                  </Badge>
                )}
                {product.status === 'active' && (
                  <Badge variant="default" className="text-xs">
                    Активно
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">{product.brand}</span>
                {product.model && <span>{product.model}</span>}
                <span className="capitalize">{product.condition}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {product.product_location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{product.product_location}</span>
                    </div>
                  )}
                  
                  {product.view_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{product.view_count}</span>
                    </div>
                  )}

                  {product.rating_seller && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>{product.rating_seller}</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ${formatPrice(product.price)}
                  </div>
                  
                  {showOfferStatus && product.user_offer_price && (
                    <div className="text-sm text-gray-600">
                      Ваше предложение: <span className="font-medium">${formatPrice(product.user_offer_price)}</span>
                    </div>
                  )}
                  
                  {product.user_offer_created_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(product.user_offer_created_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Продавец: {product.seller_name}</span>
                <span>Место: {product.place_number}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductListItem;
