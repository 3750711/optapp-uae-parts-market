
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import CatalogProductImage from "@/components/ui/CatalogProductImage";
import ProductStatusChangeDialog from "@/components/product/ProductStatusChangeDialog";
import { ProductProps } from "./ProductCard";

interface ProductListItemProps {
  product: ProductProps;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ 
  product, 
  showSoldButton = false, 
  onStatusChange 
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'sold':
        return <Badge variant="destructive" className="text-xs">Продано</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">На проверке</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">В архиве</Badge>;
      default:
        return null;
    }
  };

  const primaryImage = product.preview_image || 
    product.product_images?.find(img => img.is_primary)?.preview_url ||
    product.product_images?.[0]?.preview_url ||
    product.product_images?.[0]?.url ||
    product.image ||
    "/placeholder.svg";

  // Получаем каталожное превью если доступно
  const catalogThumbnail = product.product_images?.find(img => img.is_primary)?.preview_url ||
    product.product_images?.[0]?.preview_url;

  return (
    <div className="group bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-4">
      <Link to={`/product/${product.id}`} className="flex gap-4">
        {/* Optimized catalog image */}
        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative bg-gray-50 rounded-lg overflow-hidden">
          <CatalogProductImage
            src={primaryImage}
            alt={product.title}
            thumbnailUrl={catalogThumbnail}
            className="w-full h-full"
            lazy={true}
          />
          {product.lot_number && (
            <Badge 
              variant="outline" 
              className="absolute top-1 left-1 text-xs bg-white/95 text-gray-800 border-gray-300 backdrop-blur-sm font-medium shadow-sm px-1 py-0"
            >
              {product.lot_number}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors text-sm sm:text-base">
              {product.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(product.status)}
            </div>
          </div>
          
          {(product.brand || product.model) && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2">
              {[product.brand, product.model].filter(Boolean).join(' ')}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg sm:text-xl font-bold text-primary">
              {formatPrice(product.price)} $
            </span>
            
            {product.seller_name && (
              <span className="text-xs text-gray-500 truncate ml-2">
                {product.seller_name}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Sold button */}
      {showSoldButton && product.status === 'active' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <ProductStatusChangeDialog
            productId={product.id}
            productName={product.title}
            onStatusChange={onStatusChange || (() => {})}
          />
        </div>
      )}
    </div>
  );
};

export default ProductListItem;
