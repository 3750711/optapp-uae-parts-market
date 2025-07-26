import React, { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Phone, MessageCircle, ExternalLink, ShoppingCart } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { SimpleMakeOfferButton } from "@/components/price-offer/SimpleMakeOfferButton";
import { SimpleOfferButton } from "@/components/price-offer/SimpleOfferButton";
import { BlitzPriceSection } from "@/components/price-offer/BlitzPriceSection";
import { formatPrice } from "@/utils/formatPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "@/components/ui/OptimizedImage";

export interface ProductProps {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  condition?: string;
  seller_name?: string;
  seller_id: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  description?: string;
  lot_number?: number;
  place_number?: number;
  delivery_price?: number;
  product_location?: string;
  telegram_url?: string;
  phone_url?: string;
  view_count?: number;
  rating_seller?: number;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
  image?: string;
  product_images?: Array<{ id?: string; url: string; is_primary?: boolean; product_id?: string }>;
  product_videos?: Array<{ url: string }>;
  created_at?: string;
  updated_at?: string;
  has_active_offers?: boolean;
  max_offer_price?: number | null;
  offers_count?: number;
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
}: ProductCardProps) => {
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/product/${product.id}`);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(product.id, newStatus);
    }
  };

  const handleBuyNow = () => {
    console.log('Buy now clicked for product:', product.id);
    // TODO: Implement buy now functionality
    navigate(`/product/${product.id}?action=buy`);
  };

  const statusColor = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800", 
    sold: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800"
  }[product.status] || "bg-gray-100 text-gray-800";

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

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
    has_active_offers: product.has_active_offers,
    // Fix: Add missing offer-related fields that SimpleOfferButton needs
    max_offer_price: product.max_offer_price,
    offers_count: product.offers_count || 0,
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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group">
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
          <Badge className={`absolute top-2 left-2 ${statusColor} text-xs px-2 py-1`}>
            {product.status === 'active' ? 'Активный' : 
             product.status === 'pending' ? 'На модерации' : 
             product.status === 'sold' ? 'Продан' : 'Отклонен'}
          </Badge>

          {/* View Count */}
          {product.view_count && product.view_count > 0 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {product.view_count}
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
            <div className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </div>
            {product.condition && (
              <Badge variant="outline" className="text-xs">
                {product.condition}
              </Badge>
            )}
          </div>

          {/* Enhanced Product Details */}
          <div className="space-y-1 mb-3 text-xs text-gray-600">
            {/* Seller Info */}
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
            {product.delivery_price && product.delivery_price > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Доставка:</span>
                <span>{formatPrice(product.delivery_price)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2">
        {/* Blitz Buy Section for active products */}
        {product.status === 'active' && (
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
          
          {product.telegram_url && (
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
              navigate(`/product/${product.id}`);
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
