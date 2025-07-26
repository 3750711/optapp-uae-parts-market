import React, { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink, MapPin } from "lucide-react";
import ProductCarousel from "@/components/product/ProductCarousel";
import { formatPrice } from "@/utils/formatPrice";
import { useNavigate } from "react-router-dom";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ProductStatusChangeDialog from "@/components/product/ProductStatusChangeDialog";
import { ProductProps } from "@/components/product/ProductCard";

interface SellerProductCardProps {
  product: ProductProps;
  onStatusChange?: () => void;
}

const SellerProductCard = memo(({ product, onStatusChange }: SellerProductCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/product/${product.id}`);
  };

  const statusColor = {
    active: "bg-success text-success-foreground",
    pending: "bg-warning text-warning-foreground", 
    sold: "bg-destructive text-destructive-foreground",
    archived: "bg-muted text-muted-foreground"
  }[product.status] || "bg-muted text-muted-foreground";

  const statusLabel = {
    active: "Активный",
    pending: "На модерации", 
    sold: "Продан",
    archived: "В архиве"
  }[product.status] || "Неизвестно";

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div onClick={handleCardClick} className="cursor-pointer">
        {/* Mobile-optimized Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {product.product_images && product.product_images.length > 1 ? (
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <span className="text-sm">Нет изображения</span>
            </div>
          )}
          
          {/* Status Badge */}
          <Badge className={`absolute top-2 left-2 ${statusColor} text-xs px-2 py-1`}>
            {statusLabel}
          </Badge>

          {/* View Count */}
          {product.view_count && product.view_count > 0 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {product.view_count}
            </div>
          )}

          {/* Lot Number - Prominent Display */}
          {product.lot_number && (
            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
              Лот #{product.lot_number}
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title and Brand/Model */}
          <div>
            <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            {(product.brand || product.model) && (
              <p className="text-sm text-muted-foreground">
                {[product.brand, product.model].filter(Boolean).join(' ')}
              </p>
            )}
          </div>

          {/* Price - Prominent */}
          <div className="text-xl font-bold text-primary">
            {formatPrice(product.price)}
          </div>

          {/* Key Details for Seller */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Place Number - Prominent */}
            {product.place_number && (
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <div className="text-xs text-muted-foreground">Место</div>
                <div className="font-semibold text-secondary-foreground">#{product.place_number}</div>
              </div>
            )}
            
            {/* Location */}
            {product.product_location && (
              <div className="bg-accent/50 rounded-lg p-2 text-center">
                <div className="text-xs text-muted-foreground">Локация</div>
                <div className="font-medium text-accent-foreground truncate">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {product.product_location}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Price */}
          {product.delivery_price && product.delivery_price > 0 && (
            <div className="text-sm text-muted-foreground">
              Доставка: <span className="font-medium">{formatPrice(product.delivery_price)}</span>
            </div>
          )}
        </CardContent>
      </div>

      {/* Mobile-optimized Action Buttons */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex gap-3">
          {/* Mark as Sold Button - Full width for mobile */}
          {product.status === 'active' && (
            <div className="flex-1">
              <ProductStatusChangeDialog
                productId={product.id}
                productName={product.title}
                onStatusChange={onStatusChange || (() => {})}
              />
            </div>
          )}

          {/* View Details Button */}
          <Button
            variant="outline"
            size="default"
            className="min-w-[120px] text-sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Подробнее
          </Button>
        </div>
      </div>
    </Card>
  );
});

SellerProductCard.displayName = "SellerProductCard";

export default SellerProductCard;