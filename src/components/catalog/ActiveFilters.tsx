
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface ActiveFiltersProps {
  searchQuery?: string;
  hideSoldProducts?: boolean;
  selectedBrand?: string;
  selectedModel?: string;
  onClearSearch?: () => void;
  onClearSoldFilter?: () => void;
  onClearBrandModel?: () => void;
  onClearAll?: () => void;
  findBrandNameById?: (brandId: string | null) => string | null;
  findModelNameById?: (modelId: string | null) => string | null;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  searchQuery,
  hideSoldProducts,
  selectedBrand,
  selectedModel,
  onClearSearch,
  onClearSoldFilter,
  onClearBrandModel,
  onClearAll,
  findBrandNameById,
  findModelNameById
}) => {
  const hasActiveFilters = !!(searchQuery || hideSoldProducts || selectedBrand || selectedModel);
  
  const brandName = selectedBrand ? findBrandNameById?.(selectedBrand) : null;
  const modelName = selectedModel ? findModelNameById?.(selectedModel) : null;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 text-sm text-blue-700">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Активные фильтры:</span>
      </div>
      
      {searchQuery && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          AI Поиск: "{searchQuery}"
          <button
            onClick={onClearSearch}
            className="ml-1 hover:bg-blue-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {brandName && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
          Марка: {brandName}
          <button
            onClick={onClearBrandModel}
            className="ml-1 hover:bg-green-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {modelName && (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
          Модель: {modelName}
          <button
            onClick={onClearBrandModel}
            className="ml-1 hover:bg-purple-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {hideSoldProducts && (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
          Скрыть проданные
          <button
            onClick={onClearSoldFilter}
            className="ml-1 hover:bg-orange-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 text-xs"
      >
        Очистить все
      </Button>
    </div>
  );
};

export default ActiveFilters;
