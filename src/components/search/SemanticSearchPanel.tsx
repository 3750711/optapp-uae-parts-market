import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, Brain, Filter, Loader2, Zap } from 'lucide-react';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import ProductCard from '@/components/product/ProductCard';

interface SearchFilters {
  brand?: string;
  location?: string;
  price_min?: number;
  price_max?: number;
  status?: string;
}

export const SemanticSearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState([0.7]);
  const [limit, setLimit] = useState([20]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const { search, reset, isSearching, results, lastQuery, totalResults, hasResults } = useSemanticSearch();

  const handleSearch = async () => {
    await search(query, {
      threshold: threshold[0],
      limit: limit[0],
      filters,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Семантический поиск с ИИ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Опишите что ищете... (например: 'фара для BMW X5')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !query.trim()}
              className="min-w-[100px]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Поиск...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Найти
                </>
              )}
            </Button>
          </div>

          {/* Advanced Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Точность поиска: {(threshold[0] * 100).toFixed(0)}%
              </Label>
              <Slider
                value={threshold}
                onValueChange={setThreshold}
                min={0.5}
                max={0.95}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Количество результатов: {limit[0]}
              </Label>
              <Slider
                value={limit}
                onValueChange={setLimit}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Фильтры
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Бренд</Label>
                  <Input
                    placeholder="BMW, Mercedes..."
                    value={filters.brand || ''}
                    onChange={(e) => updateFilter('brand', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Локация</Label>
                  <Input
                    placeholder="Dubai, Sharjah..."
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Мин. цена</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={filters.price_min || ''}
                    onChange={(e) => updateFilter('price_min', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label>Макс. цена</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={filters.price_max || ''}
                    onChange={(e) => updateFilter('price_max', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Search Stats */}
          {lastQuery && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Запрос: "{lastQuery}"</span>
              {hasResults && (
                <Badge variant="secondary">
                  {totalResults} результатов
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span>Выполняется семантический анализ...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {hasResults && !isSearching && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Результаты поиска</h3>
            <Button variant="outline" onClick={reset}>
              Очистить
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((result) => (
              <div key={result.id} className="relative">
                <ProductCard
                  product={{
                    id: result.id,
                    title: result.title,
                    brand: result.brand,
                    model: result.model,
                    price: result.price,
                    seller_name: result.seller_name,
                    seller_id: result.id, // We'll use result.id as seller_id for now
                    status: result.status as any,
                    product_location: result.location,
                    image: result.preview_image_url,
                    similarity_score: result.similarity,
                  }}
                />
                <Badge 
                  className="absolute top-2 right-2 bg-primary text-primary-foreground"
                >
                  {(result.similarity * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasResults && !isSearching && lastQuery && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Товары не найдены по запросу "{lastQuery}"</p>
              <p className="text-sm mt-2">Попробуйте:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Уменьшить точность поиска</li>
                <li>• Использовать другие ключевые слова</li>
                <li>• Убрать фильтры</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};