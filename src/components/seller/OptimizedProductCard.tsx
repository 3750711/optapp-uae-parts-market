import React from "react";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Product } from "@/types/product";

interface OptimizedProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

const OptimizedProductCard = React.memo(({ product, onSelect }: OptimizedProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
      onClick={() => onSelect(product)}
    >
      <div className="flex gap-4">
        {/* Image Preview */}
        <div className="w-20 h-20 flex-shrink-0">
          {primaryImage ? (
            <OptimizedImage
              src={primaryImage.url}
              alt={product.title}
              className="w-full h-full rounded-md object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Photo</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              Lot: {product.lot_number || 'N/A'}
            </Badge>
            <Badge 
              variant={product.status === 'active' ? 'success' : 'secondary'}
              className="text-xs"
            >
              {product.status}
            </Badge>
          </div>
          
          <h3 className="font-medium text-sm mb-1 line-clamp-2 leading-tight">
            {product.title}
          </h3>
          
          {(product.brand || product.model) && (
            <p className="text-sm text-gray-600 mb-1 truncate">
              {[product.brand, product.model].filter(Boolean).join(' ')}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-primary">
              ${formatPrice(product.price)}
            </span>
            {product.delivery_price && (
              <span className="text-xs text-gray-500">
                Delivery: ${formatPrice(product.delivery_price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedProductCard.displayName = "OptimizedProductCard";

export default OptimizedProductCard;
