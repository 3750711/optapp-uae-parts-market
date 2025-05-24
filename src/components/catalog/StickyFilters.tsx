
import React, { useState, useEffect } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface StickyFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBrandName?: string | null;
  selectedModelName?: string | null;
  onClearSearch: () => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  handleSearchSubmit: (e: React.FormEvent) => void;
}

const StickyFilters: React.FC<StickyFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedBrandName,
  selectedModelName,
  onClearSearch,
  onOpenFilters,
  hasActiveFilters,
  handleSearchSubmit
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 200);
    };

    if (isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile]);

  if (!isMobile || !isSticky) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-3 animate-slide-down">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className={`relative flex-1 transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/20' : ''} rounded-lg`}>
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-primary' : 'text-gray-400'}`}>
            <Search className="h-4 w-4" />
          </span>
          <Input
            type="text"
            placeholder="Поиск..."
            className="pl-10 pr-8 bg-white/80 border-gray-200 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenFilters}
          className={`relative ${hasActiveFilters ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          )}
        </Button>
      </form>
      
      {/* Показываем активные фильтры */}
      {(selectedBrandName || selectedModelName) && (
        <div className="flex gap-1 mt-2">
          {selectedBrandName && (
            <Badge variant="secondary" className="text-xs">
              {selectedBrandName}
            </Badge>
          )}
          {selectedModelName && (
            <Badge variant="secondary" className="text-xs">
              {selectedModelName}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default StickyFilters;
