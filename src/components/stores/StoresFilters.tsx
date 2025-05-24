
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoresFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

const StoresFilters: React.FC<StoresFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Поиск магазинов..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sort by */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Сортировать по" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Дате создания</SelectItem>
            <SelectItem value="name">Названию</SelectItem>
            <SelectItem value="rating">Рейтингу</SelectItem>
            <SelectItem value="product_count">Количеству товаров</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort order toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>
    </div>
  );
};

export default StoresFilters;
