
import React, { useState, useEffect } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface StickyFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClearSearch: () => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  handleSearchSubmit: (e: React.FormEvent) => void;
}

const StickyFilters: React.FC<StickyFiltersProps> = ({
  searchQuery,
  setSearchQuery,
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
    <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-3 animate-slide-down shadow-sm">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className={`relative flex-1 transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/20' : ''} rounded-lg`}>
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`}>
            <Search className="h-4 w-4" />
          </span>
          <Input
            type="text"
            placeholder="Поиск товаров..."
            className="pl-10 pr-8 bg-background/80 border-input rounded-lg h-10 text-sm focus:ring-2 focus:ring-primary/20 transition-all duration-200"
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
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-muted/50 transition-colors duration-200"
              onClick={() => setSearchQuery('')}
              aria-label="Очистить поиск"
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
          className={`relative h-10 w-10 transition-all duration-200 hover:scale-105 ${
            hasActiveFilters 
              ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20' 
              : 'bg-background border-input text-muted-foreground hover:border-border hover:text-foreground'
          }`}
          aria-label="Открыть фильтры"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full animate-pulse"></span>
          )}
        </Button>
      </form>
    </div>
  );
};

export default StickyFilters;
