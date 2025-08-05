import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';

interface SimpleProductCardProps {
  product: Product;
}

export const SimpleProductCard: React.FC<SimpleProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  
  const primaryImage = product.product_images?.find(img => img.is_primary) 
    || product.product_images?.[0];

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg overflow-hidden cursor-pointer group hover:shadow-md transition-shadow duration-200"
    >
      {/* Product Image */}
      <div className="aspect-square bg-muted overflow-hidden">
        {primaryImage ? (
          <img 
            src={primaryImage.url} 
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Нет фото</span>
          </div>
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
          <span className="font-bold text-lg text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
};