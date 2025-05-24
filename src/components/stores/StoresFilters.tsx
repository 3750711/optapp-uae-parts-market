
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
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border-0 shadow-card backdrop-blur-sm transition-all duration-300 hover:shadow-elevation">
      {/* Search */}
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-hover:text-primary group-focus-within:text-primary" />
        <Input
          placeholder="Поиск магазинов..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 transition-all duration-300 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-300 bg-white/70 backdrop-blur-sm"
        />
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-gray-600">
          <SlidersHorizontal className="h-4 w-4 text-gray-500 transition-colors duration-300 hover:text-primary" />
          <span className="text-sm font-medium">Сортировка:</span>
        </div>
        
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48 transition-all duration-300 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white/70 backdrop-blur-sm">
            <SelectValue placeholder="Сортировать по" />
          </SelectTrigger>
          <SelectContent className="animate-fade-in">
            <SelectItem value="created_at" className="transition-colors duration-200 hover:bg-primary/10">
              Дате создания
            </SelectItem>
            <SelectItem value="name" className="transition-colors duration-200 hover:bg-primary/10">
              Названию
            </SelectItem>
            <SelectItem value="rating" className="transition-colors duration-200 hover:bg-primary/10">
              Рейтингу
            </SelectItem>
            <SelectItem value="product_count" className="transition-colors duration-200 hover:bg-primary/10">
              Количеству товаров
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sort order toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-primary hover:text-white border-primary/20 hover:border-primary"
          title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
        >
          <span className="text-lg transition-transform duration-300 hover:scale-110">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default StoresFilters;
