import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { ProductProps } from '@/components/product/ProductCard';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface SimplifiedProductCardProps {
  product: ProductProps;
}

export const SimplifiedProductCard: React.FC<SimplifiedProductCardProps> = ({ product }) => {
  const primaryImage = product.product_images?.find(img => img.is_primary) 
    || product.product_images?.[0];

  const statusColor = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800", 
    sold: "bg-red-100 text-red-800",
    archived: "bg-gray-100 text-gray-800"
  }[product.status] || "bg-gray-100 text-gray-800";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          <OptimizedImage
            src={primaryImage.url}
            alt={product.title}
            className={`w-full h-full object-cover ${
              product.status === 'sold' ? 'opacity-60' : ''
            }`}
            cloudinaryPublicId={product.cloudinary_public_id}
            cloudinaryUrl={product.cloudinary_url}
            size="card"
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Нет фото</span>
          </div>
        )}
        
        {/* Status Badge */}
        <Badge className={`absolute top-2 left-2 ${statusColor} text-xs px-2 py-1`}>
          {product.status === 'active' ? 'Активный' : 
           product.status === 'pending' ? 'Модерация' : 
           product.status === 'sold' ? 'Продан' : 'Архив'}
        </Badge>

        {/* View Count */}
        {product.view_count && product.view_count > 0 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {product.view_count}
          </div>
        )}
        
        {/* Sold Overlay */}
        {product.status === 'sold' && (
          <div className="absolute inset-0 bg-black/20" />
        )}
      </div>

      {/* Product Info */}
      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-foreground">
          {product.title}
        </h3>
        
        {/* Brand and Model */}
        {(product.brand || product.model) && (
          <p className="text-xs text-muted-foreground mb-3">
            {[product.brand, product.model].filter(Boolean).join(' ')}
          </p>
        )}
        
        {/* Price or Login Prompt */}
        {!product.price && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <span>🔒</span>
            <span>Войдите, чтобы увидеть цену и контакты</span>
          </div>
        )}
        
        {product.price && (
          <p className="text-xl font-bold text-primary mb-3">
            {typeof product.price === 'number' 
              ? product.price.toLocaleString('ru-RU') 
              : product.price} руб.
          </p>
        )}
        
        {/* Product Details */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {/* Seller Name (only if price is visible) */}
          {product.seller_name && product.price && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Продавец:</span>
              <span className="truncate max-w-[140px]">{product.seller_name}</span>
            </div>
          )}
          
          {/* Location */}
          {product.product_location && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Местоположение:</span>
              <span className="truncate max-w-[140px]">{product.product_location}</span>
            </div>
          )}
          
          {/* Lot and Place Numbers */}
          {(product.lot_number || product.place_number) && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Лот/Место:</span>
              <span>
                {product.lot_number && `Лот ${product.lot_number}`}
                {product.lot_number && product.place_number && ' • '}
                {product.place_number && `Место ${product.place_number}`}
              </span>
            </div>
          )}
          
          {/* Condition */}
          {product.condition && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Состояние:</span>
              <span>{product.condition}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
