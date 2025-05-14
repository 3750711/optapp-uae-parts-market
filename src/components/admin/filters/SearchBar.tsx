
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
  disabled?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  onSearch, 
  isSearching = false,
  disabled = false
}) => {
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission behavior
      onSearch();
    }
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="relative flex items-center w-full md:w-auto">
      <Input
        type="search"
        placeholder="Поиск по названию, лот-номеру, цене..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full md:w-[300px] pr-16" // Increased right padding for both buttons
        disabled={disabled}
      />
      {searchTerm && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-10 top-0 h-10"
          onClick={handleClearSearch}
          type="button"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-0 top-0 h-10"
        onClick={onSearch}
        type="button"
        disabled={disabled}
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default SearchBar;
