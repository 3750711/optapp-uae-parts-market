
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface OrdersSearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  clearSearchTitle?: string;
}

const OrdersSearchBar: React.FC<OrdersSearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  onClear,
  placeholder = "Search orders...",
  clearSearchTitle = "Clear search"
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const hasActiveSearch = searchTerm && searchTerm.trim() !== '';

  return (
    <div className="relative w-full mb-6">
      <div className="relative group transition-all duration-300 rounded-lg shadow-sm hover:shadow-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-400">
          <Search className="h-4 w-4" />
        </span>
        
        <Input
          type="search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-12 py-3 border-gray-200 bg-white rounded-lg text-sm"
        />
        
        {hasActiveSearch && onClear && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-100"
            onClick={onClear}
            title={clearSearchTitle}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrdersSearchBar;
