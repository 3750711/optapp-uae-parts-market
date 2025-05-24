
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchHistory, SearchHistoryItem } from '@/hooks/useSearchHistory';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EnhancedSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  selectedBrandName?: string | null;
  selectedModelName?: string | null;
  onSelectFromHistory?: (item: SearchHistoryItem) => void;
  suggestions?: string[];
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  handleSearchSubmit,
  selectedBrandName,
  selectedModelName,
  onSelectFromHistory,
  suggestions = []
}) => {
  const isMobile = useIsMobile();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  } = useSearchHistory();

  // Popular search terms (can be fetched from analytics)
  const popularSearches = [
    'фары', 'тормозные диски', 'масляный фильтр', 'амортизаторы',
    'стеклоочистители', 'свечи зажигания', 'ремень ГРМ', 'сцепление'
  ];

  // Filter suggestions based on current query
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase()) && 
    suggestion.toLowerCase() !== searchQuery.toLowerCase()
  ).slice(0, 5);

  const recentSearches = searchHistory.slice(0, 3);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.length > 0 || isFocused);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSubmit(e);
    
    if (searchQuery.trim()) {
      addToHistory(searchQuery, selectedBrandName || undefined, selectedModelName || undefined);
    }
    
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    // Trigger search automatically
    const fakeEvent = new Event('submit') as any;
    handleFormSubmit(fakeEvent);
  };

  const handleHistoryItemSelect = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setShowSuggestions(false);
    
    if (onSelectFromHistory) {
      onSelectFromHistory(item);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="relative w-full">
      <Popover open={showSuggestions && (filteredSuggestions.length > 0 || recentSearches.length > 0 || (!searchQuery && popularSearches.length > 0))}>
        <PopoverTrigger asChild>
          <form 
            onSubmit={handleFormSubmit} 
            className={`w-full transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}
          >
            <div className={`relative flex-1 group transition-all duration-300 rounded-xl ${isFocused ? 'shadow-lg ring-2 ring-primary/20' : 'shadow-md hover:shadow-lg'}`}>
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${isFocused ? 'text-primary' : 'text-gray-400'}`}>
                <Search className={`h-5 w-5 transition-opacity ${searchQuery ? 'opacity-100' : 'group-hover:opacity-70'}`} />
              </span>
              <Input 
                ref={inputRef}
                type="text"
                placeholder="Поиск автозапчастей, брендов, моделей..." 
                className="pl-11 pr-10 py-2.5 md:py-3 text-base border-gray-200 shadow-none bg-white/70 backdrop-blur-sm rounded-xl focus:border-primary/50"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              {searchQuery && (
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-100 transition-all duration-200"
                  onClick={(e) => {
                    e.preventDefault();
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </Button>
              )}
            </div>
          </form>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          sideOffset={5}
        >
          <Command>
            <CommandList className="max-h-72">
              {/* Search suggestions */}
              {filteredSuggestions.length > 0 && (
                <CommandGroup heading="Предложения">
                  {filteredSuggestions.map((suggestion, index) => (
                    <CommandItem
                      key={`suggestion-${index}`}
                      onSelect={() => handleSuggestionSelect(suggestion)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      <span>{suggestion}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <CommandGroup heading="Недавние поиски">
                  {recentSearches.map((item, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      onSelect={() => handleHistoryItemSelect(item)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <span>{item.query}</span>
                        {(item.brand || item.model) && (
                          <div className="text-xs text-gray-500">
                            {[item.brand, item.model].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Popular searches when no query */}
              {!searchQuery && popularSearches.length > 0 && (
                <CommandGroup heading="Популярные запросы">
                  {popularSearches.map((search, index) => (
                    <CommandItem
                      key={`popular-${index}`}
                      onSelect={() => handleSuggestionSelect(search)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span>{search}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* No results */}
              <CommandEmpty>Ничего не найдено</CommandEmpty>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EnhancedSearchBar;
