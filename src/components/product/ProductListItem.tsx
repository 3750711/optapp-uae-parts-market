
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import ProductStatusChangeDialog from "@/components/product/ProductStatusChangeDialog";
import OptimizedImage from "@/components/ui/OptimizedImage";
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

  // Use original images for catalog display
  const catalogImage = React.useMemo(() => {
    // Priority 1: Main cloudinary URL (original quality)
    if (product.cloudinary_url) {
      return product.cloudinary_url;
    }
    
    // Priority 2: Primary image or first image
    const primaryImageData = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
    return primaryImageData?.url || 
           product.image || 
           "/placeholder.svg";
  }, [product.cloudinary_url, product.product_images, product.image]);

  // Format title with brand and model
  const formatTitle = () => {
    const brandModel = [product.brand, product.model].filter(Boolean).join(' ');
    if (brandModel) {
      return `${product.title} ${brandModel}`;
    }
    return product.title;
  };

  return (
    <div className="group bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-4">
      <Link to={`/product/${product.id}`} className="flex gap-4">
        {/* Изображение товара - используем оригинальные изображения */}
        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative bg-gray-50 rounded-lg overflow-hidden">
          <OptimizedImage
            src={catalogImage}
            alt={product.title}
            className="w-full h-full object-contain bg-gray-50"
            cloudinaryPublicId={product.cloudinary_public_id || undefined}
            cloudinaryUrl={product.cloudinary_url || undefined}
            size="card"
            priority={false}
            sizes="(max-width: 640px) 80px, 96px"
            useCatalogOptimization={true} // Используем оригинальные изображения
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
              {formatTitle()}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(product.status)}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg sm:text-xl font-bold text-primary">
              {formatPrice(product.price)} $
            </span>
            
            {product.seller_name && (
              <div className="flex items-center gap-1 text-xs text-gray-500 truncate ml-2">
                <span className="truncate">{product.seller_name}</span>
                {product.rating_seller && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating_seller.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
      
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
