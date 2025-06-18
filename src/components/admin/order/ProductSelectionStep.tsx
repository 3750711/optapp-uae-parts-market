
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, ArrowLeft, Filter, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ProductCardWithPreview from './ProductCardWithPreview';
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
  onSearchChange: (searchTerm: string) => void;
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
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('all');
    onClearFilters();
  };

  const filteredByStatus = statusFilter === 'all' 
    ? filteredProducts 
    : filteredProducts.filter(product => product.status === statusFilter);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Selected seller info */}
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Выбранный продавец</Badge>
            </div>
            <h3 className="font-medium text-sm">{selectedSeller.full_name}</h3>
            <p className="text-sm text-gray-600">OPT: {selectedSeller.opt_id}</p>
          </CardContent>
        </Card>

        {/* Search and filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск товара..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 text-base h-12"
            />
            {searchTerm && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Фильтры
            </Button>
            
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Статус товара" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="draft">Черновики</SelectItem>
                  <SelectItem value="sold">Проданные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Products grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              Товары ({filteredByStatus.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredByStatus.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
              <p className="text-sm">
                {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'У этого продавца пока нет товаров'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredByStatus.map((product) => (
                <ProductCardWithPreview
                  key={product.id}
                  product={product}
                  onSelect={onProductSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Шаг 2: Выберите товар</CardTitle>
          <CardDescription>
            Продавец: {selectedSeller.full_name} ({selectedSeller.opt_id})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск товара..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="draft">Черновики</SelectItem>
                  <SelectItem value="sold">Проданные</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== 'all') && (
                <Button variant="outline" onClick={handleClear}>
                  Сбросить
                </Button>
              )}
            </div>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredByStatus.length === 0 ? (
            <div className="text-center py-12 text-gray-500 mb-6">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
              <p className="text-sm">
                {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'У этого продавца пока нет товаров'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {filteredByStatus.map((product) => (
                <ProductCardWithPreview
                  key={product.id}
                  product={product}
                  onSelect={onProductSelect}
                />
              ))}
            </div>
          )}

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onBackToSeller}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductSelectionStep;
