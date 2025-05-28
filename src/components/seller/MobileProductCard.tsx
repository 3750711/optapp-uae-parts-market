
import React from "react";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Eye } from "lucide-react";

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
}

interface MobileProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onPreview: (product: Product) => void;
}

const MobileProductCard = React.memo(({ product, onSelect, onPreview }: MobileProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Изображение */}
      <div className="relative h-32 bg-gray-100 rounded-t-lg overflow-hidden">
        {primaryImage ? (
          <OptimizedImage
            src={primaryImage.url}
            alt={product.title}
            className="w-full h-full object-cover"
            placeholder={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-xs">Нет фото</span>
          </div>
        )}
        
        {/* Кнопка предварительного просмотра */}
        <button
          onClick={() => onPreview(product)}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Eye className="h-3 w-3 text-gray-600" />
        </button>
      </div>

      {/* Содержимое */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-xs">
            Лот: {product.lot_number}
          </Badge>
          <Badge 
            variant={product.status === 'active' ? 'success' : 'secondary'}
            className="text-xs"
          >
            {product.status}
          </Badge>
        </div>
        
        <h3 className="font-medium text-sm line-clamp-2 leading-tight">
          {product.title}
        </h3>
        
        {(product.brand || product.model) && (
          <p className="text-xs text-gray-600 truncate">
            {[product.brand, product.model].filter(Boolean).join(' ')}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            ${formatPrice(product.price)}
          </span>
          {product.delivery_price && (
            <span className="text-xs text-gray-500">
              +${formatPrice(product.delivery_price)}
            </span>
          )}
        </div>

        {/* Кнопка выбора */}
        <button
          onClick={() => onSelect(product)}
          className="w-full mt-2 bg-primary text-white py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Выбрать
        </button>
      </div>
    </div>
  );
});

MobileProductCard.displayName = "MobileProductCard";

export default MobileProductCard;
