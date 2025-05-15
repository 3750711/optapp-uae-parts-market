
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  activeSearchTerm?: string;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  onSearch,
  onClear,
  activeSearchTerm,
  placeholder = "Поиск..."
}) => {
  // Handle key press - if Enter is pressed, trigger search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // Determine if there is an active search to show clear button
  const hasActiveSearch = activeSearchTerm && activeSearchTerm.trim() !== '';

  return (
    <div className="relative flex items-center w-full">
      <Input
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full pr-10"
      />
      <div className="absolute right-0 top-0 h-10 flex">
        {hasActiveSearch && onClear && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10"
            onClick={onClear}
            title="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10"
          onClick={onSearch}
          title="Поиск"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
