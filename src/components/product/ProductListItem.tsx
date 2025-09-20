
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, Clock, Star, Activity, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { OfferStatusBadge } from '@/components/offers/OfferStatusBadge';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ProductProps } from '@/components/product/ProductCard';
import ProductStatusChangeDialog from '@/components/product/ProductStatusChangeDialog';
// Auction functionality removed
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/formatPrice';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { RepostButton } from './RepostButton';

interface ProductListItemProps {
  product: ProductProps & {
    user_offer_price?: number;
    user_offer_status?: string;
    user_offer_created_at?: string;
    user_offer_expires_at?: string;
    max_other_offer?: number;
    is_user_leading?: boolean;
    has_pending_offer?: boolean;
  };
  batchOffersData?: any;
  showSoldButton?: boolean;
  onStatusChange?: (productId: string, newStatus: string) => void;
  onRepostSuccess?: () => void; // Add repost success callback
  showOfferStatus?: boolean;
  showAuctionInfo?: boolean;
  lastUpdateTime?: Date;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ 
  product, 
  batchOffersData,
  showOfferStatus = false,
  showAuctionInfo = false,
  lastUpdateTime,
  showSoldButton = false,
  onStatusChange,
  onRepostSuccess,
}) => {
  const [isRecentUpdate, setIsRecentUpdate] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useMobileLayout();

  const handleProductClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if current user is the seller of this product
    const isSeller = user?.id === product.seller_id;
    
    if (isSeller) {
      // Redirect sellers to their seller-specific product page
      navigate(`/seller/product/${product.id}`);
    } else {
      // Redirect all other users to the regular product page
      navigate(`/product/${product.id}`);
    }
  };

  // Handle recent updates animation
  useEffect(() => {
    if (lastUpdateTime) {
      const timeSinceUpdate = Date.now() - lastUpdateTime.getTime();
      if (timeSinceUpdate < 5000) { // 5 seconds
        setIsRecentUpdate(true);
        setPriceChanged(true);
        
        const timer = setTimeout(() => {
          setIsRecentUpdate(false);
          setPriceChanged(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [lastUpdateTime]);

  // Debug logging to track data changes
  useEffect(() => {
    console.log('📦 ProductListItem render:', {
      productId: product.id,
      title: product.title,
      userOfferPrice: product.user_offer_price,
      maxOtherOffer: product.max_other_offer,
      isUserLeading: product.is_user_leading,
      lastUpdateTime: lastUpdateTime?.toISOString(),
      showAuctionInfo
    });
  }, [product.id, product.user_offer_price, product.max_other_offer, product.is_user_leading, lastUpdateTime, showAuctionInfo]);

  // Memoized calculations that react to data changes
  const { 
    formatPrice, 
    getTimeRemaining,
    batchData,
    totalOffers,
    maxCompetitorPrice,
    isUserLeading,
    isFreshData
  } = useMemo(() => {
    const formatPriceFunc = (price: number) => new Intl.NumberFormat('ru-RU').format(price);
    
    const getTimeRemainingFunc = (expiresAt: string) => {
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

    // Get batch data for this product
    const batchDataForProduct = batchOffersData?.find((data: any) => data.product_id === product.id);
    
    // Calculate competitive data - use batch data if available, otherwise use product data
    const totalOffersCount = batchDataForProduct?.total_offers_count || 0;
    const maxCompetitorPriceValue = batchDataForProduct?.max_offer_price || product.max_other_offer || 0;
    const isUserLeadingValue = batchDataForProduct?.current_user_is_max ?? product.is_user_leading ?? false;
    
    // Enhanced fresh data detection
    const isFreshDataValue = lastUpdateTime && Date.now() - lastUpdateTime.getTime() < 5000;
    
    console.log('🔍 ProductListItem calculations:', {
      productId: product.id,
      totalOffersCount,
      maxCompetitorPriceValue,
      isUserLeadingValue,
      isFreshDataValue,
      batchDataExists: !!batchDataForProduct
    });
    
    return {
      formatPrice: formatPriceFunc,
      getTimeRemaining: getTimeRemainingFunc,
      batchData: batchDataForProduct,
      totalOffers: totalOffersCount,
      maxCompetitorPrice: maxCompetitorPriceValue,
      isUserLeading: isUserLeadingValue,
      isFreshData: isFreshDataValue
    };
  }, [batchOffersData, product.id, product.max_other_offer, product.is_user_leading, lastUpdateTime]);

  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-300",
      isRecentUpdate && "border-blue-300 shadow-blue-100 ring-2 ring-blue-200 animate-pulse",
      isFreshData && "border-green-300 shadow-green-100 ring-1 ring-green-200",
      isMobile && "active:bg-gray-50"
    )}>
      <CardContent 
        className={cn(
          "p-4",
          isMobile && "cursor-pointer"
        )}
        onClick={isMobile ? handleProductClick : undefined}
      >
        <div className="flex gap-3 sm:gap-4">
          {/* Recent Update Indicator */}
          {isRecentUpdate && (
            <div className="absolute top-2 right-2 z-10">
              <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs animate-bounce">
                <Activity className="h-3 w-3" />
                <span>Обновлено</span>
              </div>
            </div>
          )}

          {/* Product Image - Fixed square */}
          <div className="flex-shrink-0">
            <div 
              onClick={!isMobile ? handleProductClick : undefined} 
              className={cn(!isMobile && "cursor-pointer")}
            >
              <OptimizedImage
                src={product.image || product.cloudinary_url || product.product_images?.[0]?.url || "/placeholder.svg"}
                alt={product.title}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg aspect-square"
                cloudinaryPublicId={product.cloudinary_public_id}
                cloudinaryUrl={product.cloudinary_url}
                size="thumbnail"
                priority={false}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Title and Status Badges Row */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-3">
                {/* Product Title - max 2 lines */}
                <div 
                  onClick={!isMobile ? handleProductClick : undefined}
                  className={cn(
                    "text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-1",
                    !isMobile && "cursor-pointer"
                  )}
                >
                  {product.title}
                </div>
                
                {/* Brand and Model - subtext */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                  {product.brand && <span className="font-medium">{product.brand}</span>}
                  {product.model && product.brand && <span>•</span>}
                  {product.model && <span>{product.model}</span>}
                </div>

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
              
              {/* Status Badges - right aligned */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {product.lot_number && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">
                    Lot {product.lot_number}
                  </Badge>
                )}
                {product.status === 'sold' && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    Sold
                  </Badge>
                )}
                {product.status === 'pending' && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    modiration
                  </Badge>
                )}
                {product.status === 'active' && (
                  <Badge variant="default" className="text-xs px-1.5 py-0.5">
                    Active
                  </Badge>
                )}
                {maxCompetitorPrice > 0 && (
                   <div className="text-xs text-green-600 font-medium">
                     Offer ${formatPrice(maxCompetitorPrice)}
                   </div>
                )}
              </div>
            </div>

            {/* Price and Rating Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {product.rating_seller && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating_seller.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className={cn(
                  "text-xl sm:text-2xl font-bold text-gray-900 transition-all duration-300",
                  priceChanged && "text-blue-600 animate-pulse"
                )}>
                  ${formatPrice(product.price)}
                </div>
                
                {showOfferStatus && product.user_offer_price && (
                  <div className={cn(
                    "text-sm text-gray-600 transition-all duration-300 mt-1",
                    priceChanged && "text-blue-600 font-medium"
                  )}>
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

            {/* Action Buttons Container - Bottom of card */}
            <div className="flex flex-row gap-2 w-full mt-auto">
              {showSoldButton && product.status === 'active' && onStatusChange && (
                <div 
                  onClick={isMobile ? (e) => e.stopPropagation() : undefined}
                  className="flex-1"
                >
                  <ProductStatusChangeDialog
                    productId={product.id}
                    productName={product.title}
                    onStatusChange={() => onStatusChange(product.id, 'sold')}
                  />
                </div>
              )}
              
              {/* Repost Button for Sellers */}
              {user?.id === product.seller_id && (
                <div 
                  onClick={isMobile ? (e) => e.stopPropagation() : undefined}
                  className="flex-1"
                >
                  <RepostButton
                    productId={product.id}
                    lastNotificationSentAt={product.last_notification_sent_at}
                    status={product.status}
                    sellerId={product.seller_id}
                    currentPrice={product.price}
                    productTitle={product.title}
                    onRepostSuccess={onRepostSuccess}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductListItem;
