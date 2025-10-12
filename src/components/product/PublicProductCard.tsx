import React, { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Phone, MessageCircle, Loader2 } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { useDeliveryLogic } from "@/hooks/useDeliveryLogic";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatPrice } from "@/utils/formatPrice";
import { getPublicProfileTranslations } from "@/utils/translations/publicProfile";
import { Lang } from "@/types/i18n";

export interface PublicProductProps {
  id: string;
  title: string;
  brand?: string;
  model?: string;
  condition?: string;
  seller_name?: string;
  seller_id: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  description?: string;
  lot_number?: number;
  place_number?: number;
  price?: number;
  delivery_price?: number;
  product_location?: string;
  telegram_url?: string;
  phone_url?: string;
  view_count?: number;
  tg_views_frozen?: number;
  rating_seller?: number;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
  image?: string;
  product_images?: Array<{ id?: string; url: string; is_primary?: boolean; product_id?: string }>;
  created_at?: string;
  updated_at?: string;
}

interface PublicProductCardProps {
  product: PublicProductProps;
  language: Lang;
  disableCarousel?: boolean;
  isBuyer?: boolean;
}

const PublicProductCard = memo(({
  product,
  language,
  disableCarousel = false,
  isBuyer = false,
}: PublicProductCardProps) => {
  const t = getPublicProfileTranslations(language);
  const [imageError, setImageError] = useState(false);
  
  // Use centralized delivery logic
  const { shouldShowDeliveryPrice } = useDeliveryLogic({
    deliveryPrice: product.delivery_price
  });

  const statusColor = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800", 
    sold: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800"
  }[product.status] || "bg-gray-100 text-gray-800";

  const statusText = {
    active: language === 'en' ? 'Active' : language === 'ru' ? 'Активный' : 'সক্রিয়',
    pending: language === 'en' ? 'Pending' : language === 'ru' ? 'На модерации' : 'অপেক্ষমান',
    sold: language === 'en' ? 'Sold' : language === 'ru' ? 'Продан' : 'বিক্রিত',
    archived: language === 'en' ? 'Archived' : language === 'ru' ? 'Архивирован' : 'সংরক্ষিত'
  }[product.status] || 'Unknown';

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
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
            <span className="text-sm">{t.noImage}</span>
          </div>
        )}
        
        {/* Status Badge */}
        <Badge className={`absolute top-2 left-2 ${statusColor} text-xs px-2 py-1 flex items-center gap-1`}>
          {product.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
          {statusText}
        </Badge>

        {/* Telegram Views */}
        {product.status !== 'pending' && product.tg_views_frozen != null && product.tg_views_frozen > 0 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {product.tg_views_frozen.toLocaleString()}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title and Brand/Model */}
        <div className="mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {product.title}
          </h3>
          {(product.brand || product.model) && (
            <p className="text-xs text-gray-500">
              {[product.brand, product.model].filter(Boolean).join(' ')}
            </p>
          )}
        </div>

        {/* Enhanced Product Details */}
        <div className="space-y-1 mb-3 text-xs text-gray-600">
          {/* Price - only if available */}
          {product.price != null && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t.price || 'Price'}:</span>
              <span className="font-bold text-primary">{formatPrice(product.price)}</span>
            </div>
          )}
          
          {/* Seller Info - only if available */}
          {product.seller_name && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t.seller}:</span>
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
              <span className="font-medium">{t.location}:</span>
              <span className="truncate max-w-[120px]">{product.product_location}</span>
            </div>
          )}
          
          {/* Lot and Place Numbers */}
          {(product.lot_number || product.place_number) && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t.lot}/{t.place}:</span>
              <span>
                {product.lot_number && `${t.lot} ${product.lot_number}`}
                {product.lot_number && product.place_number && ' • '}
                {product.place_number && `${t.place} ${product.place_number}`}
              </span>
            </div>
          )}
          
          {/* Delivery Price - only if available and should be shown */}
          {shouldShowDeliveryPrice && product.delivery_price != null && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t.delivery}:</span>
              <span>{formatPrice(product.delivery_price)}</span>
            </div>
          )}
        </div>

        {/* Contact Buttons + View Details for Buyers */}
        <div className="flex gap-2">
          {isBuyer && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/products/${product.id}`;
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              {t.viewDetails}
            </Button>
          )}
          
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
              {t.call}
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
              {t.telegram}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

PublicProductCard.displayName = "PublicProductCard";

export default PublicProductCard;