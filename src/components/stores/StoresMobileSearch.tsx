
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, ArrowUpDown } from 'lucide-react';

interface StoresMobileSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

const StoresMobileSearch: React.FC<StoresMobileSearchProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const sortOptions = [
    { value: 'created_at', label: 'Дате создания' },
    { value: 'rating', label: 'Рейтингу' },
    { value: 'product_count', label: 'Количеству товаров' },
    { value: 'name', label: 'Названию' }
  ];

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className={`relative transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/20' : ''} rounded-lg`}>
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-primary' : 'text-gray-400'}`}>
          <Search className="h-4 w-4" />
        </span>
        <Input
          type="text"
          placeholder="Поиск магазинов..."
          className="pl-10 pr-8 bg-white border-gray-200 rounded-lg h-12 text-base"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="flex-1 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                Сортировка по {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 flex-shrink-0"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <ArrowUpDown className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default StoresMobileSearch;
