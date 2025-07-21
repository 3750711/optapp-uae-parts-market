
import React, { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { MakeOfferButtonOptimized } from "@/components/price-offer/MakeOfferButtonOptimized";
import { SimpleOfferButton } from "@/components/price-offer/SimpleOfferButton";
import { BlitzPriceSection } from "@/components/price-offer/BlitzPriceSection";
import { formatPrice } from "@/utils/formatPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useNavigate } from "react-router-dom";
import { ProductProps } from "./ProductCard";
import { BatchOfferData } from '@/hooks/use-price-offers-batch';

interface ProductListItemProps {
  product: ProductProps;
  showSoldButton?: boolean;
  onStatusChange?: (productId: string, newStatus: string) => void;
  batchOffersData?: BatchOfferData[];
  useSimpleOfferButton?: boolean;
}

const ProductListItem = memo(({
  product,
  showSoldButton = false,
  onStatusChange,
  batchOffersData,
  useSimpleOfferButton = false,
}: ProductListItemProps) => {
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
    navigate(`/product/${product.id}?action=buy`);
  };

  const statusColor = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800", 
    sold: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800"
  }[product.status] || "bg-gray-100 text-gray-800";

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  // Convert ProductProps to Product type for offer buttons
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
        <CardContent className="p-3">
          <div className="flex gap-3">
            {/* Image Section */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              {primaryImage && !imageError ? (
                <img
                  src={primaryImage.url}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">Нет фото</span>
                </div>
              )}
              
              {/* Status Badge */}
              <Badge className={`absolute top-1 left-1 ${statusColor} text-xs px-1 py-0.5`}>
                {product.status === 'active' ? 'Активный' : 
                 product.status === 'pending' ? 'На модерации' : 
                 product.status === 'sold' ? 'Продан' : 'Отклонен'}
              </Badge>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {product.title}
                  </h3>
                  {(product.brand || product.model) && (
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {[product.brand, product.model].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
                
                {/* Price */}
                <div className="text-lg font-bold text-primary ml-2">
                  {formatPrice(product.price)}
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                <div className="flex items-center justify-between">
                  <span>Продавец:</span>
                  <span className="truncate max-w-[100px]">{product.seller_name}</span>
                </div>
                
                {product.product_location && (
                  <div className="flex items-center justify-between">
                    <span>Место:</span>
                    <span className="truncate max-w-[100px]">{product.product_location}</span>
                  </div>
                )}
                
                {product.condition && (
                  <div className="flex items-center justify-between">
                    <span>Состояние:</span>
                    <span className="truncate max-w-[100px]">{product.condition}</span>
                  </div>
                )}
                
                {product.view_count && product.view_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Просмотры:</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {product.view_count}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-end gap-2 ml-2">
              {/* Blitz Buy Section */}
              {product.status === 'active' && (
                <BlitzPriceSection
                  price={product.price}
                  onBuyNow={handleBuyNow}
                  compact={true}
                />
              )}

              {/* Make Offer Button */}
              {useSimpleOfferButton ? (
                <SimpleOfferButton 
                  product={productForOfferButton}
                  compact={true}
                />
              ) : (
                <MakeOfferButtonOptimized 
                  product={productForOfferButton} 
                  compact={true}
                  batchOffersData={batchOffersData}
                />
              )}

              {/* Contact Buttons */}
              <div className="flex gap-1">
                {product.phone_url && (
                  <Button
                    variant="outline" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${product.phone_url}`, '_blank');
                    }}
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                )}
                
                {product.telegram_url && (
                  <Button
                    variant="outline"
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://t.me/${product.telegram_url}`, '_blank');
                    }}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${product.id}`);
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Admin Controls */}
      {showSoldButton && hasAdminAccess && (
        <div className="px-3 pb-3">
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
        </div>
      )}
    </Card>
  );
});

ProductListItem.displayName = "ProductListItem";

export default ProductListItem;
