import React, { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Phone, MessageCircle, ExternalLink, ShoppingCart, Loader2, Target } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { SimpleMakeOfferButton } from "@/components/price-offer/SimpleMakeOfferButton";
import { SimpleOfferButton } from "@/components/price-offer/SimpleOfferButton";
import { BlitzPriceSection } from "@/components/price-offer/BlitzPriceSection";
import { formatPrice } from "@/utils/formatPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useDeliveryLogic } from "@/hooks/useDeliveryLogic";
import { useProductImage } from "@/hooks/useProductImage";

export interface ProductProps {
  id: string;
  title: string;
  price: number | null; // Nullable for unauthenticated users
  brand?: string;
  model?: string;
  condition?: string;
  seller_name?: string | null; // Nullable for unauthenticated users
  seller_id: string | null; // Nullable for unauthenticated users
  status: 'pending' | 'active' | 'sold' | 'archived';
  description?: string;
  lot_number?: number;
  place_number?: number;
  delivery_price?: number | null; // Nullable for unauthenticated users
  product_location?: string;
  telegram_url?: string | null; // Nullable for unauthenticated users
  phone_url?: string | null; // Nullable for unauthenticated users
  view_count?: number;
  rating_seller?: number;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
  image?: string;
  similarity_score?: number; // Add similarity score for AI search highlighting
  product_images?: Array<{ id?: string; url: string; is_primary?: boolean; product_id?: string }>;
  product_videos?: Array<{ url: string }>;
  created_at?: string;
  updated_at?: string;
  optid_created?: string;
  catalog_position?: string; // Catalog position for repost cooldown
}

interface ProductCardProps {
  product: ProductProps;
  onStatusChange?: (productId: string, newStatus: string) => void;
  showSoldButton?: boolean;
  disableCarousel?: boolean;
  hideMakeOfferButton?: boolean;
  useFallbackQueries?: boolean;
  batchOffersData?: import('@/hooks/use-price-offers-batch').BatchOfferData[];
  useSimpleOfferButton?: boolean;
  onRepostSuccess?: () => void; // Add callback for repost success
}

const ProductCard = memo(({
  product,
  onStatusChange,
  showSoldButton = false,
  disableCarousel = false,
  hideMakeOfferButton = false,
  useFallbackQueries = false,
  batchOffersData,
  useSimpleOfferButton = false,
  onRepostSuccess,
}: ProductCardProps) => {
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  
  // Use centralized delivery logic
  const { shouldShowDeliveryPrice } = useDeliveryLogic({
    deliveryPrice: product.delivery_price
  });

  const handleCardClick = (e: React.MouseEvent) => {
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

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(product.id, newStatus);
    }
  };

  const handleBuyNow = () => {
    console.log('Buy now clicked for product:', product.id);
    // TODO: Implement buy now functionality
    
    // Always redirect to regular product page for buying
    navigate(`/product/${product.id}?action=buy`);
  };

  const statusColor = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800", 
    sold: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800"
  }[product.status] || "bg-gray-100 text-gray-800";

  const { primaryImage: productPrimaryImageUrl } = useProductImage(product as any);
  const primaryImage = product.product_images?.find(img => img.url === productPrimaryImageUrl);
  
  // Determine if this product has high similarity score (threshold: 0.45 for current 0.3 search threshold)
  const isHighRelevance = product.similarity_score !== undefined && product.similarity_score > 0.45;

  // Convert ProductProps to Product type for MakeOfferButton
  const productForOfferButton = {
    id: product.id,
    title: product.title,
    price: product.price,
    brand: product.brand,
    model: product.model || '',
    condition: product.condition || 'Новое',
    seller_name: product.seller_name,
    seller_id: product.seller_id,
    status: product.status as 'pending' | 'active' | 'sold' | 'archived',
    description: product.description,
    lot_number: product.lot_number || 0,
    place_number: product.place_number,
    delivery_price: product.delivery_price,
    product_location: product.product_location,
    telegram_url: product.telegram_url,
    phone_url: product.phone_url,
    view_count: product.view_count,
    rating_seller: product.rating_seller,
    cloudinary_url: product.cloudinary_url,
    cloudinary_public_id: product.cloudinary_public_id,
    product_images: product.product_images?.map(img => ({
      id: img.id || '',
      product_id: img.product_id || product.id,
      url: img.url,
      is_primary: img.is_primary || false
    })) || [],
    product_videos: product.product_videos?.map(video => ({
      id: '',
      product_id: product.id,
      url: video.url
    })) || [],
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString()
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group relative ${isHighRelevance ? 'ring-2 ring-primary/20' : ''}`}>
      {/* High Relevance Indicator */}
      {isHighRelevance && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60 z-10"></div>
      )}
      
      <div onClick={handleCardClick}>
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {!disableCarousel && product.product_images && product.product_images.length > 1 ? (
            <ProductCarousel
              images={product.product_images.map(img => ({ 
                id: img.id || '', 
                url: img.url, 
                is_primary: img.is_primary || false 
              }))}
              productTitle={product.title}
              cloudinaryPublicId={product.cloudinary_public_id}
              cloudinaryUrl={product.cloudinary_url}
            />
          ) : primaryImage && !imageError ? (
            <OptimizedImage
              src={primaryImage.url}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              cloudinaryPublicId={product.cloudinary_public_id}
              cloudinaryUrl={product.cloudinary_url}
              size="card"
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span className="text-sm">Нет изображения</span>
            </div>
          )}
          
          {/* Status Badge */}
          <Badge className={`absolute top-2 left-2 ${statusColor} text-xs px-2 py-1 flex items-center gap-1`}>
            {product.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
            {product.status === 'active' ? 'Активный' : 
             product.status === 'pending' ? 'modiration' : 
             product.status === 'sold' ? 'Продан' : 'Отклонен'}
          </Badge>

          {/* View Count */}
          {product.view_count && product.view_count > 0 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {product.view_count}
            </div>
          )}
          
          {/* High Relevance Badge */}
          {isHighRelevance && (
            <div className="absolute bottom-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Target className="h-3 w-3" />
              <span className="font-medium">Точное соответствие</span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title and Brand/Model */}
          <div className="mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            {(product.brand || product.model) && (
              <p className="text-xs text-gray-500">
                {[product.brand, product.model].filter(Boolean).join(' ')}
              </p>
            )}
          </div>

          {/* Price and Details */}
          <div className="flex items-center justify-between mb-3">
            {product.price !== null ? (
              <div className="text-lg font-bold text-primary">
                {formatPrice(product.price)}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                🔒 Войдите для просмотра
              </div>
            )}
          </div>

          {/* Enhanced Product Details */}
          <div className="space-y-1 mb-3 text-xs text-gray-600">
            {/* Seller Info */}
            {product.seller_name && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Продавец:</span>
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[120px]">{product.seller_name}</span>
                  {product.rating_seller && (
                    <span className="text-yellow-600 flex items-center">
                      ⭐ {product.rating_seller}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Location */}
            {product.product_location && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Местоположение:</span>
                <span className="truncate max-w-[120px]">{product.product_location}</span>
              </div>
            )}
            
            {/* Lot and Place Numbers */}
            {(product.lot_number || product.place_number) && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Лот/Место:</span>
                <span>
                  {product.lot_number && `Лот ${product.lot_number}`}
                  {product.lot_number && product.place_number && ' • '}
                  {product.place_number && `Место ${product.place_number}`}
                </span>
              </div>
            )}
            
            {/* Delivery Price */}
            {shouldShowDeliveryPrice && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Доставка:</span>
                <span>{formatPrice(product.delivery_price!)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2">
        {/* Blitz Buy Section for active products */}
        {product.status === 'active' && product.price !== null && (
          <BlitzPriceSection
            price={product.price}
            onBuyNow={handleBuyNow}
            compact={true}
          />
        )}

        {/* Make Offer Button - Simple or Optimized based on context */}
        {!hideMakeOfferButton && (
          useSimpleOfferButton ? (
            <SimpleOfferButton 
              product={productForOfferButton}
            />
          ) : (
            <SimpleMakeOfferButton 
              product={productForOfferButton}
            />
          )
        )}

        <div className="flex gap-2">
          {/* Contact Buttons */}
          {product.phone_url && (
            <Button
              variant="outline" 
              size="sm"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${product.phone_url}`, '_blank');
              }}
            >
              <Phone className="h-3 w-3 mr-1" />
              Позвонить
            </Button>
          )}
          
          {product.telegram_url && product.seller_id && (
            <Button
              variant="outline"
              size="sm" 
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://t.me/${product.telegram_url}`, '_blank');
              }}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Telegram
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              
              // Use same logic as card click for "Details" button
              const isSeller = user?.id === product.seller_id;
              if (isSeller) {
                navigate(`/seller/product/${product.id}`);
              } else {
                navigate(`/product/${product.id}`);
              }
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Подробнее
          </Button>
        </div>

        {/* Admin Controls */}
        {showSoldButton && hasAdminAccess && (
          <div className="flex gap-2 pt-2 border-t">
            {product.status === 'active' && (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('sold');
                }}
              >
                Отметить как проданный
              </Button>
            )}
            {product.status === 'pending' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange('active');
                  }}
                >
                  Одобрить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange('rejected');
                  }}
                >
                  Отклонить
                </Button>
              </>
            )}
          </div>
        )}

      </div>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
