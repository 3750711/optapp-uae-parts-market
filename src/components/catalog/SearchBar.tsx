
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  handleSearchSubmit 
}) => {
  const isMobile = useIsMobile();
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <form onSubmit={handleSearchSubmit} className="w-full">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
          <Search className="h-5 w-5"/>
        </span>
        <Input 
          type="text"
          placeholder="Поиск по названию, бренду, модели..." 
          className="pl-10 pr-10 py-2 md:py-3 shadow-sm text-base"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchSubmit(e);
              if (isMobile) {
                (e.target as HTMLElement).blur();
              }
            }
          }}
        />
        {searchQuery && (
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
