
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, onSearch }) => {
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative flex items-center w-full md:w-auto">
      <Input
        type="search"
        placeholder="Поиск товаров..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full md:w-[300px] pr-10"
      />
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-0 top-0 h-10"
        onClick={onSearch}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SearchBar;
