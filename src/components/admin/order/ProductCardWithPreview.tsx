
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProductImage } from '@/hooks/useProductImage';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
  lot_number: number;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
}

interface ProductCardWithPreviewProps {
  product: Product;
  onSelect: (product: Product) => void;
}

const ProductCardWithPreview: React.FC<ProductCardWithPreviewProps> = ({
  product,
  onSelect
}) => {
  const isMobile = useIsMobile();
  const { primaryImage, cloudinaryUrl } = useProductImage(product);

  return (
    <Card className={`h-full hover:shadow-md transition-shadow ${isMobile ? 'touch-target' : ''}`}>
      <CardContent className={`p-4 ${isMobile ? 'p-3' : ''} h-full flex flex-col`}>
        {/* Product Image */}
        <div className={`relative mb-3 ${isMobile ? 'h-32' : 'h-48'} bg-gray-100 rounded-lg overflow-hidden flex-shrink-0`}>
          <OptimizedImage
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover"
            cloudinaryPublicId={product.cloudinary_public_id}
            cloudinaryUrl={cloudinaryUrl}
            size="card"
            priority={false}
          />
          
          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant={product.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {product.status}
            </Badge>
          </div>
          
          {/* Lot number badge */}
          {product.lot_number && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs bg-white/90">
                Лот: {product.lot_number}
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3 className={`font-semibold mb-2 line-clamp-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
            {product.title}
          </h3>
          
          {/* Brand and Model */}
          {(product.brand || product.model) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.brand && (
                <Badge variant="outline" className="text-xs">
                  {product.brand}
                </Badge>
              )}
              {product.model && (
                <Badge variant="outline" className="text-xs">
                  {product.model}
                </Badge>
              )}
            </div>
          )}
          
          {/* Price */}
          <div className="mt-auto">
            <div className={`font-bold text-primary mb-3 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {product.price} AED
            </div>
            
            <Button 
              onClick={() => onSelect(product)}
              size={isMobile ? "default" : "sm"}
              className={`w-full ${isMobile ? 'min-h-[44px] text-base' : ''}`}
            >
              Выбрать товар
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardWithPreview;
