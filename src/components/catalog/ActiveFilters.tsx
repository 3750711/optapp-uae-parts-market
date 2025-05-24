
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface ActiveFiltersProps {
  searchQuery?: string;
  selectedBrandName?: string | null;
  selectedModelName?: string | null;
  hideSoldProducts?: boolean;
  onClearSearch?: () => void;
  onClearBrand?: () => void;
  onClearModel?: () => void;
  onClearSoldFilter?: () => void;
  onClearAll?: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  searchQuery,
  selectedBrandName,
  selectedModelName,
  hideSoldProducts,
  onClearSearch,
  onClearBrand,
  onClearModel,
  onClearSoldFilter,
  onClearAll
}) => {
  const hasActiveFilters = !!(searchQuery || selectedBrandName || selectedModelName || hideSoldProducts);

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
          Поиск: "{searchQuery}"
          <button
            onClick={onClearSearch}
            className="ml-1 hover:bg-blue-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {selectedBrandName && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
          Марка: {selectedBrandName}
          <button
            onClick={onClearBrand}
            className="ml-1 hover:bg-green-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {selectedModelName && (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
          Модель: {selectedModelName}
          <button
            onClick={onClearModel}
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
