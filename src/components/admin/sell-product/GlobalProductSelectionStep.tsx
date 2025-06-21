
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { useProductsQuery } from '@/hooks/useProductsQuery';
import { useDebounce } from '@/hooks/useDebounce';

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
  seller_id: string;
  seller_name: string;
}

interface GlobalProductSelectionStepProps {
  onProductSelect: (product: Product) => void;
}

const GlobalProductSelectionStep: React.FC<GlobalProductSelectionStepProps> = ({
  onProductSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { products, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useProductsQuery({
    debouncedSearchTerm,
    statusFilter,
    sellerFilter,
    pageSize: 20
  });

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Фильтр по цене
    if (priceFilter !== 'all') {
      if (priceFilter === 'low') {
        filtered = filtered.filter(p => p.price < 1000);
      } else if (priceFilter === 'medium') {
        filtered = filtered.filter(p => p.price >= 1000 && p.price < 5000);
      } else if (priceFilter === 'high') {
        filtered = filtered.filter(p => p.price >= 5000);
      }
    }
    
    return filtered;
  }, [products, priceFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('active');
    setPriceFilter('all');
    setSellerFilter('all');
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
          Найдите товар среди всех доступных в системе
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Поиск и фильтры */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по названию товара..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={clearFilters} size="sm">
              <X className="h-4 w-4 mr-1" />
              Очистить
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Фильтры:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="sold">Проданные</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Любая цена</SelectItem>
                <SelectItem value="low">До $1,000</SelectItem>
                <SelectItem value="medium">$1,000 - $5,000</SelectItem>
                <SelectItem value="high">От $5,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Результаты поиска */}
        {isLoading ? (
          <div className="text-center py-8">Загрузка товаров...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Товары не найдены по заданным критериям
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Найдено товаров: {filteredProducts.length}
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
