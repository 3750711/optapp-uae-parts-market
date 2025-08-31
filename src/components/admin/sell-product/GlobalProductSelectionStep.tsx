
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useProductsQuery } from '@/hooks/useProductsQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { Product } from '@/types/product';

interface GlobalProductSelectionStepProps {
  onProductSelect: (product: Product) => void;
}

const GlobalProductSelectionStep: React.FC<GlobalProductSelectionStepProps> = ({
  onProductSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { products, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useProductsQuery({
    debouncedSearchTerm,
    statusFilter: 'active',
    sellerFilter: 'all',
    pageSize: 20
  });

  const filteredProducts = products;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const clearFilters = () => {
    setSearchTerm('');
  };

  const getPrimaryImage = (product: Product) => {
    return product.product_images?.find(img => img.is_primary)?.url || 
           product.product_images?.[0]?.url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Шаг 1: Выберите товар для продажи
        </CardTitle>
        <CardDescription>
          Найдите товар среди всех доступных в системе. Используйте поиск по названию, бренду, модели, продавцу или номеру лота.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Поиск и фильтры */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию, бренду, модели, продавцу, лоту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={clearFilters} size="icon" className="h-8 w-8">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Результаты поиска */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse">Поиск товаров...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <div>
                <p>Товары не найдены по запросу "{searchTerm}"</p>
                <p className="text-xs mt-2">Попробуйте другие ключевые слова или очистите фильтры</p>
              </div>
            ) : (
              <p>Товары не найдены по заданным критериям</p>
            )}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4 flex items-center justify-between">
              <span>Найдено товаров: {filteredProducts.length}</span>
              {searchTerm && (
                <span className="text-xs text-blue-600">
                  по запросу: "{searchTerm}"
                </span>
              )}
            </div>
            
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                  onClick={() => onProductSelect(product)}
                >
                  <div className="flex items-center gap-4">
                    {getPrimaryImage(product) && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={getPrimaryImage(product)}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
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
                            Доступен для продажи
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          {(product.brand || product.model) && (
                            <p className="text-sm text-gray-600 mb-1">
                              {[product.brand, product.model].filter(Boolean).join(' ')}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Продавец: {product.seller_name}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            ${formatPrice(product.price)}
                          </span>
                          {product.delivery_price && (
                            <p className="text-xs text-gray-500">
                              Доставка: ${formatPrice(product.delivery_price)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {hasNextPage && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GlobalProductSelectionStep;
