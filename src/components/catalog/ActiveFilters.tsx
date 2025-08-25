
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ActiveFiltersProps {
  searchQuery?: string;
  hideSoldProducts?: boolean;
  onClearSearch?: () => void;
  onClearSoldFilter?: () => void;
  onClearAll?: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  searchQuery,
  hideSoldProducts,
  onClearSearch,
  onClearSoldFilter,
  onClearAll
}) => {
  const hasActiveFilters = !!(searchQuery || hideSoldProducts);

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
      {searchQuery && (
        <Badge 
          variant="secondary" 
          className="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 border-0"
        >
          <span className="max-w-[120px] sm:max-w-[200px] truncate">
            "{searchQuery}"
          </span>
          <button
            onClick={onClearSearch}
            className="ml-1.5 hover:bg-primary/30 rounded-full p-0.5 transition-colors duration-200"
            aria-label="Удалить поисковый запрос"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      )}
      
      {hideSoldProducts && (
        <Badge 
          variant="secondary" 
          className="text-xs px-2 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors duration-200 border-0 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30"
        >
          <span className="hidden sm:inline">Без проданных</span>
          <span className="sm:hidden">Активные</span>
          <button
            onClick={onClearSoldFilter}
            className="ml-1.5 hover:bg-orange-300 dark:hover:bg-orange-700 rounded-full p-0.5 transition-colors duration-200"
            aria-label="Показать проданные товары"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      )}
      
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs px-2 py-1 h-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
          aria-label="Очистить все фильтры"
        >
          <X className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Очистить</span>
        </Button>
      )}
    </div>
  );
};

export default ActiveFilters;
