
import React, { useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);
  
  // Handle key press - if Enter is pressed, trigger search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // Determine if there is an active search to show clear button
  const hasActiveSearch = activeSearchTerm && activeSearchTerm.trim() !== '';

  return (
    <div className={`relative transition-all duration-300 w-full ${isFocused ? 'scale-[1.01]' : ''}`}>
      <div className={`relative group transition-all duration-300 rounded-lg ${isFocused ? 'shadow-lg ring-2 ring-primary/20' : 'shadow-sm hover:shadow-md'}`}>
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${isFocused ? 'text-primary' : 'text-gray-400'}`}>
          <Search className={`h-4 w-4 transition-opacity ${searchTerm ? 'opacity-100' : 'group-hover:opacity-70'}`} />
        </span>
        
        <Input
          type="search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-10 py-2 border-gray-200 bg-white/70 backdrop-blur-sm rounded-lg shadow-none ${hasActiveSearch && onClear ? 'pr-12' : 'pr-4'}`}
        />
        
        {hasActiveSearch && onClear && (
          <div className="absolute right-1 top-0 h-10 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-gray-100"
              onClick={onClear}
              title="Очистить поиск"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
