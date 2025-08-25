
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
    <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-2 animate-slide-down shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenFilters}
            className="flex items-center gap-2 text-sm"
          >
            <Search className="h-4 w-4" />
            <span>Поиск и фильтры</span>
          </Button>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
              Активны фильтры
            </Badge>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenFilters}
          className={`relative h-8 w-8 transition-all duration-200 ${
            hasActiveFilters 
              ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/15' 
              : 'bg-background border-input text-muted-foreground hover:border-border hover:text-foreground'
          }`}
          aria-label="Открыть фильтры"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse"></span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StickyFilters;
