
import React, { memo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";

interface OptimizedProductSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearSearch?: () => void;
  isSearching?: boolean;
  hasActiveSearch?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const OptimizedProductSearch = memo<OptimizedProductSearchProps>(({ 
  searchTerm, 
  onSearchChange,
  onClearSearch,
  isSearching = false,
  hasActiveSearch = false,
  placeholder = "Поиск товаров...",
  disabled = false
}) => {
  console.log('🔍 OptimizedProductSearch render:', { searchTerm, isSearching, hasActiveSearch });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && onClearSearch) {
      onClearSearch();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
        </span>
        
        <Input
          type="search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full pl-10 ${hasActiveSearch && onClearSearch ? 'pr-12' : 'pr-4'} transition-all duration-200`}
        />
        
        {hasActiveSearch && onClearSearch && (
          <div className="absolute right-1 top-0 h-10 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
              onClick={onClearSearch}
              title="Очистить поиск (Esc)"
              disabled={disabled}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
          </div>
        )}
      </div>
      
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500">
          Поиск...
        </div>
      )}
    </div>
  );
});

OptimizedProductSearch.displayName = 'OptimizedProductSearch';
