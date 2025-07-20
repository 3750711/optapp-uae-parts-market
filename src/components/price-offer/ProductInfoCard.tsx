
import React from 'react';
import { ExternalLink, Package, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductInfoCardProps {
  product: {
    id: string;
    title: string;
    brand: string;
    model: string;
    price: number;
    lot_number?: number;
    seller_name?: string;
    seller_id?: string;
    product_images?: Array<{ url: string; is_primary?: boolean }>;
  };
  compact?: boolean;
}

export const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ 
  product, 
  compact = false 
}) => {
  const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                      product.product_images?.[0]?.url;

  if (compact) {
    return (
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex gap-3">
          <Link 
            to={`/product/${product.id}`}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            {primaryImage ? (
              <img 
                src={primaryImage} 
                alt={product.title}
                className="w-12 h-12 object-cover rounded-md border"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-md border flex items-center justify-center">
                <Package className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link 
              to={`/product/${product.id}`}
              className="block hover:text-blue-600 transition-colors"
            >
              <h3 className="font-medium text-sm truncate">{product.title}</h3>
            </Link>
            <p className="text-xs text-muted-foreground">
              {product.brand} {product.model}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
              {product.lot_number && (
                <span>Лот: {product.lot_number}</span>
              )}
              {product.seller_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {product.seller_name}
                </span>
              )}
            </div>
            <p className="text-base font-bold text-blue-600 mt-1">${product.price.toLocaleString()}</p>
          </div>
          
          <Link 
            to={`/product/${product.id}`}
            className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors"
            title="Открыть товар"
          >
            <ExternalLink className="h-4 w-4 text-blue-600" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Информация о товаре</h3>
        <Link 
          to={`/product/${product.id}`}
          className="ml-auto p-1 hover:bg-blue-100 rounded transition-colors"
          title="Открыть страницу товара"
        >
          <ExternalLink className="h-4 w-4 text-blue-600" />
        </Link>
      </div>
      
      <div className="flex gap-4">
        <Link 
          to={`/product/${product.id}`}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          {primaryImage ? (
            <img 
              src={primaryImage} 
              alt={product.title}
              className="w-20 h-20 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg border flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-500" />
            </div>
          )}
        </Link>
        
        <div className="flex-1 space-y-2">
          <Link 
            to={`/product/${product.id}`}
            className="block hover:text-blue-600 transition-colors"
          >
            <h4 className="font-semibold text-lg hover:underline">{product.title}</h4>
          </Link>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium">Бренд:</span> {product.brand}</p>
            {product.model && <p><span className="font-medium">Модель:</span> {product.model}</p>}
            {product.lot_number && (
              <p><span className="font-medium">Номер лота:</span> {product.lot_number}</p>
            )}
            {product.seller_name && (
              <p className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="font-medium">Продавец:</span> {product.seller_name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
