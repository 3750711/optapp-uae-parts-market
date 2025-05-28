
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter, SortAsc, SortDesc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

export interface SearchFilters {
  searchTerm: string;
  lotNumber: string;
  priceFrom: string;
  priceTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface EnhancedProductSearchProps {
  onSearchChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  totalProducts: number;
  filteredCount: number;
}

const EnhancedProductSearch = React.memo(({ 
  onSearchChange, 
  onClearFilters,
  totalProducts,
  filteredCount 
}: EnhancedProductSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    lotNumber: '',
    priceFrom: '',
    priceTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedSearchTerm = useDebounceSearch(filters.searchTerm, 300);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onSearchChange(updated);
  }, [filters, onSearchChange]);

  React.useEffect(() => {
    updateFilters({ searchTerm: debouncedSearchTerm });
  }, [debouncedSearchTerm]);

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      lotNumber: '',
      priceFrom: '',
      priceTo: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    onClearFilters();
  };

  const hasActiveFilters = filters.searchTerm || filters.lotNumber || filters.priceFrom || filters.priceTo;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Main Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск по названию, бренду, модели..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Фильтры
          </Button>

          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">По дате</SelectItem>
              <SelectItem value="price">По цене</SelectItem>
              <SelectItem value="title">По названию</SelectItem>
              <SelectItem value="lot_number">По лоту</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => updateFilters({ 
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
          >
            {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label htmlFor="lotNumber" className="text-sm font-medium">
                Номер лота
              </Label>
              <Input
                id="lotNumber"
                placeholder="Введите номер лота"
                value={filters.lotNumber}
                onChange={(e) => updateFilters({ lotNumber: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="priceFrom" className="text-sm font-medium">
                Цена от ($)
              </Label>
              <Input
                id="priceFrom"
                type="number"
                placeholder="Мин. цена"
                value={filters.priceFrom}
                onChange={(e) => updateFilters({ priceFrom: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="priceTo" className="text-sm font-medium">
                Цена до ($)
              </Label>
              <Input
                id="priceTo"
                type="number"
                placeholder="Макс. цена"
                value={filters.priceTo}
                onChange={(e) => updateFilters({ priceTo: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Active Filters & Results */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Показано: <span className="font-medium">{filteredCount}</span> из <span className="font-medium">{totalProducts}</span>
            </span>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                {filters.searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Поиск: {filters.searchTerm}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ searchTerm: '' })}
                    />
                  </Badge>
                )}
                {filters.lotNumber && (
                  <Badge variant="secondary" className="text-xs">
                    Лот: {filters.lotNumber}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ lotNumber: '' })}
                    />
                  </Badge>
                )}
                {(filters.priceFrom || filters.priceTo) && (
                  <Badge variant="secondary" className="text-xs">
                    Цена: {filters.priceFrom || '0'} - {filters.priceTo || '∞'}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ priceFrom: '', priceTo: '' })}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Очистить всё
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

EnhancedProductSearch.displayName = "EnhancedProductSearch";

export default EnhancedProductSearch;
