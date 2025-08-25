import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SearchSuggestions from './SearchSuggestions';
import QuickFilters from './QuickFilters';
import { useClickOutside } from '@/hooks/useClickOutside';

interface EnhancedInstantSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  isSearching?: boolean;
  resultCount?: number;
  popularSearches?: string[];
  recentSearches?: string[];
}

const EnhancedInstantSearch: React.FC<EnhancedInstantSearchProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  isSearching = false,
  resultCount = 0,
  popularSearches = [],
  recentSearches = []
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchRef, () => {
    setShowSuggestions(false);
    setIsFocused(false);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Only update search query for suggestions, no auto-search
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleQuickFilter = (filter: string) => {
    setSearchQuery(filter);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSearchSubmit(fakeEvent);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSearchSubmit(fakeEvent);
    setShowSuggestions(false);
  };

  return (
    <Card className="mb-4 relative">
      <div className="p-4" ref={searchRef}>
        {/* Main Search Input */}
        <div className="relative">
          <div className={`relative flex items-center transition-all duration-200 ${
            isFocused ? 'ring-2 ring-primary/20 rounded-lg' : ''
          }`}>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Search className={`h-4 w-4 transition-colors ${
                  isFocused ? 'text-primary' : 'text-muted-foreground'
                }`} />
              )}
            </div>
            
            <Input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit(e as any);
                }
              }}
              placeholder="Введите запрос и нажмите 'Найти'"
              className="pl-10 pr-32 h-12 text-base bg-background border-input"
            />
            
            {/* Action buttons */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Очистить поиск"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                onClick={(e) => handleSearchSubmit(e as any)}
                size="sm"
                className="h-8 px-3 ml-1"
                title="Найти"
              >
                Найти
              </Button>
            </div>
          </div>

          {/* Search Results Counter */}
          {searchQuery && (
            <div className="mt-2 text-sm text-muted-foreground">
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Поиск...
                </span>
              ) : (
                <span>
                  Найдено результатов: <span className="font-medium text-foreground">{resultCount}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <QuickFilters 
          onFilterSelect={handleQuickFilter}
          activeFilter={searchQuery}
        />

        {/* Search Suggestions */}
        {showSuggestions && (
          <SearchSuggestions
            currentQuery={searchQuery}
            onSuggestionSelect={handleSuggestionSelect}
            popularSearches={popularSearches}
            recentSearches={recentSearches}
          />
        )}
      </div>
    </Card>
  );
};

export default EnhancedInstantSearch;