import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductProps } from '@/components/product/ProductCard';
import { formatPrice } from '@/utils/formatPrice';
import ProductStatusBadge from '@/components/product/ProductStatusBadge';
import { useOptimizedProductImages } from '@/hooks/useOptimizedProductImages';
import { OptimizedProductImage } from '@/components/ui/OptimizedProductImage';
import { cn } from '@/lib/utils';

interface SimpleProductCardProps {
  product: ProductProps;
}

export const SimpleProductCard: React.FC<SimpleProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  
  const { primaryImage } = useOptimizedProductImages(product, {
    maxImages: 1,
    generateVariants: true
  });

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg overflow-hidden cursor-pointer group hover:shadow-md transition-shadow duration-200"
    >
      {/* Product Image */}
      <div className="aspect-square bg-muted overflow-hidden relative">
        {primaryImage ? (
          <OptimizedProductImage
            image={primaryImage}
            alt={product.title}
            size="card"
            className={cn(
              "w-full h-full object-contain group-hover:scale-105 transition-transform duration-200",
              product.status === 'sold' && "opacity-60"
            )}
            onClick={handleClick}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Нет фото</span>
          </div>
        )}
        
        {/* Sold Badge */}
        {product.status === 'sold' && (
          <div className="absolute top-2 right-2">
            <ProductStatusBadge status="sold" size="sm" showIcon={false} />
          </div>
        )}
        
        {/* Sold Overlay */}
        {product.status === 'sold' && (
          <div className="absolute inset-0 bg-black/20" />
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-1">
        {/* Title */}
        <h4 className="font-medium text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {product.title}
        </h4>
        
        {/* Brand and Model */}
        {(product.brand || product.model) && (
          <p className="text-xs text-muted-foreground">
            {[product.brand, product.model].filter(Boolean).join(' ')}
          </p>
        )}
        
        {/* Price */}
        <div className="pt-1">
          {product.price !== null ? (
            <span className="font-bold text-lg text-foreground">
              {formatPrice(product.price)}
            </span>
          ) : (
            <div className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              🔒 Войдите, чтобы увидеть цену
            </div>
          )}
        </div>
      </div>
    </div>
  );
};