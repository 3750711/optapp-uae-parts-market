
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  onSearch,
  placeholder = "Поиск..."
}) => {
  // Handle key press - if Enter is pressed, trigger search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full pr-10"
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
