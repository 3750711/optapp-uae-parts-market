
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SimpleProductSearchFilters, { SearchFilters } from '@/components/admin/SimpleProductSearchFilters';
import { Product } from '@/types/product';

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface ProductSelectionStepProps {
  selectedSeller: SellerProfile;
  products: Product[];
  filteredProducts: Product[];
  isLoading: boolean;
  onProductSelect: (product: Product) => void;
  onSearchChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  onBackToSeller: () => void;
}

const ProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  selectedSeller,
  products,
  filteredProducts,
  isLoading,
  onProductSelect,
  onSearchChange,
  onClearFilters,
  onBackToSeller
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Шаг 2: Выберите товар</CardTitle>
        <CardDescription>
          Товары продавца: {selectedSeller.full_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleProductSearchFilters
          onSearchChange={onSearchChange}
          onClearFilters={onClearFilters}
        />
        
        {isLoading ? (
          <div className="text-center py-8">Загрузка товаров...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {products.length === 0 
              ? "У данного продавца нет активных товаров"
              : "Товары не найдены по заданным критериям"
            }
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              Найдено активных товаров: {filteredProducts.length} из {products.length}
            </div>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                onClick={() => onProductSelect(product)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Лот: {product.lot_number || 'N/A'}
                      </Badge>
                      <Badge 
                        variant={product.status === 'active' ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {product.status}
                      </Badge>
                      {product.status === 'active' && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          Доступен для заказа
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {product.title}
                    </h3>
                    {(product.brand || product.model) && (
                      <p className="text-sm text-gray-600 mb-1">
                        {[product.brand, product.model].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {product.delivery_price && (
                      <p className="text-xs text-gray-500">
                        Доставка: ${formatPrice(product.delivery_price)}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-lg font-bold text-primary">
                      ${formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <Button variant="outline" onClick={onBackToSeller}>
            Назад
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSelectionStep;
