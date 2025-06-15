
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Search, Filter, SortAsc, SortDesc, RotateCcw, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useLocalStorageFilters } from "@/hooks/useLocalStorageFilters";
import { toast } from "@/components/ui/use-toast";

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
  const { savedFilters, saveFilters, clearSavedFilters } = useLocalStorageFilters();
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    lotNumber: '',
    priceFrom: '',
    priceTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debouncedSearchTerm = useDebounceSearch(filters.searchTerm, 500);

  // Загружаем сохраненные фильтры при инициализации
  useEffect(() => {
    if (savedFilters) {
      setFilters(savedFilters);
      // Показываем расширенные фильтры если есть сохраненные значения
      if (savedFilters.lotNumber || savedFilters.priceFrom || savedFilters.priceTo) {
        setShowAdvanced(true);
      }
    }
  }, [savedFilters]);

  // Проверяем наличие несохраненных изменений
  useEffect(() => {
    if (savedFilters) {
      const hasChanges = JSON.stringify(filters) !== JSON.stringify(savedFilters);
      setHasUnsavedChanges(hasChanges);
    } else {
      const hasAnyFilters = Boolean(filters.searchTerm || filters.lotNumber || filters.priceFrom || filters.priceTo);
      setHasUnsavedChanges(hasAnyFilters);
    }
  }, [filters, savedFilters]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onSearchChange(updated);
  }, [filters, onSearchChange]);

  React.useEffect(() => {
    updateFilters({ searchTerm: debouncedSearchTerm });
  }, [debouncedSearchTerm]);

  const clearAllFilters = () => {
    const defaultFilters = {
      searchTerm: '',
      lotNumber: '',
      priceFrom: '',
      priceTo: '',
      sortBy: 'created_at',
      sortOrder: 'desc' as const
    };
    setFilters(defaultFilters);
    onClearFilters();
    clearSavedFilters();
    setHasUnsavedChanges(false);
    toast({
      title: "Фильтры очищены",
      description: "Все фильтры были сброшены",
    });
  };

  const saveCurrentFilters = () => {
    saveFilters(filters);
    setHasUnsavedChanges(false);
    toast({
      title: "Фильтры сохранены",
      description: "Ваши настройки фильтров сохранены",
    });
  };

  const restoreSavedFilters = () => {
    if (savedFilters) {
      setFilters(savedFilters);
      onSearchChange(savedFilters);
      setHasUnsavedChanges(false);
      toast({
        title: "Фильтры восстановлены",
        description: "Применены сохраненные настройки",
      });
    }
  };

  const hasActiveFilters = filters.searchTerm || filters.lotNumber || filters.priceFrom || filters.priceTo;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Главный поиск и управление */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск по названию, бренду, модели..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Фильтры</span>
            </Button>

            <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
              <SelectTrigger className="w-32 sm:w-40">
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
        </div>

        {/* Расширенные фильтры */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Управление сохранением фильтров */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveCurrentFilters}
                  className="flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  Сохранить фильтры
                </Button>
              )}
              
              {savedFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restoreSavedFilters}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Восстановить
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Активные фильтры и результаты */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Показано: <span className="font-medium">{filteredCount}</span> из <span className="font-medium">{totalProducts}</span>
            </span>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-1 flex-wrap">
                {filters.searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Поиск: {filters.searchTerm}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => updateFilters({ searchTerm: '' })}
                    />
                  </Badge>
                )}
                {filters.lotNumber && (
                  <Badge variant="secondary" className="text-xs">
                    Лот: {filters.lotNumber}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => updateFilters({ lotNumber: '' })}
                    />
                  </Badge>
                )}
                {(filters.priceFrom || filters.priceTo) && (
                  <Badge variant="secondary" className="text-xs">
                    Цена: {filters.priceFrom || '0'} - {filters.priceTo || '∞'}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" 
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
