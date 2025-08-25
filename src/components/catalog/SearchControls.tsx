import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface SearchControlsProps {
  searchTerm: string;
  onSearch: (query: string) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  isSearching?: boolean;
  onClearSearch?: () => void;
  onClearSoldFilter?: () => void;
  onClearAll?: () => void;
}

const SearchControls: React.FC<SearchControlsProps> = ({
  searchTerm,
  onSearch,
  hideSoldProducts,
  setHideSoldProducts,
  isSearching = false,
  onClearSearch,
  onClearSoldFilter,
  onClearAll
}) => {
  const [inputValue, setInputValue] = React.useState(searchTerm);

  React.useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = inputValue.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
    onClearSearch?.();
  };

  const hasActiveFilters = !!(searchTerm || hideSoldProducts);

  return (
    <div className="space-y-4">
      {/* Main search and controls container */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-card border border-border shadow-sm">
        {/* Search input section */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-10 pr-20 h-10 bg-background border-input focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            
            {/* Action buttons inside input */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {isSearching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 w-6 p-0 hover:bg-muted/50"
                  title="Очистить"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Hide sold products toggle */}
        <div className="flex items-center shrink-0">
          <div className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-muted/30 transition-colors duration-200">
            <Checkbox
              id="hide-sold"
              checked={hideSoldProducts}
              onCheckedChange={setHideSoldProducts}
              className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="hide-sold"
              className="text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors duration-200 whitespace-nowrap"
            >
              Скрыть проданные
            </label>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 animate-fade-in">
          {searchTerm && (
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/15 transition-colors duration-200 border-0"
            >
              <span className="max-w-[120px] sm:max-w-[200px] truncate">
                "{searchTerm}"
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
              className="text-xs px-2 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200 border-0"
            >
              <span>Активные</span>
              <button
                onClick={onClearSoldFilter}
                className="ml-1.5 hover:bg-secondary/60 rounded-full p-0.5 transition-colors duration-200"
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
              className="text-xs px-2 py-1 h-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200 ml-auto"
              aria-label="Очистить все фильтры"
            >
              <X className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Очистить все</span>
              <span className="sm:hidden">Очистить</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchControls;