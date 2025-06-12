
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  selectedBrandName?: string | null;
  selectedModelName?: string | null;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  handleSearchSubmit
}) => {
  const isMobile = useIsMobile();
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSubmit(e);
    
    if (isMobile) {
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };
  
  return (
    <div className="relative w-full">
      <form 
        onSubmit={handleFormSubmit} 
        className={`w-full transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}
      >
        <div className={`relative flex-1 group transition-all duration-300 rounded-xl ${isFocused ? 'shadow-lg ring-2 ring-primary/20' : 'shadow-md hover:shadow-lg'}`}>
          <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${isFocused ? 'text-primary' : 'text-gray-400'}`}>
            <Search className={`h-5 w-5 transition-opacity ${searchQuery ? 'opacity-100' : 'group-hover:opacity-70'}`} />
          </span>
          <Input 
            type="text"
            placeholder="Поиск по названию, бренду, модели..." 
            className="pl-11 pr-10 py-2.5 md:py-3 text-base border-gray-200 shadow-none bg-white/70 backdrop-blur-sm rounded-xl focus:border-primary/50"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFormSubmit(e);
              }
            }}
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
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
          )}
          
          <Button 
            type="submit" 
            variant="ghost" 
            size="sm" 
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${searchQuery ? 'hidden' : 'md:flex hidden'} items-center rounded-lg px-3 py-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-500`}
          >
            <span className="mr-2">Поиск</span>
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-xs font-medium">↵</kbd>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
