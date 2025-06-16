
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OptimizedStoreFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  verifiedFilter: 'all' | 'verified' | 'unverified';
  onVerifiedFilterChange: (filter: 'all' | 'verified' | 'unverified') => void;
  totalCount: number;
  isSearching?: boolean;
}

const OptimizedStoreFilters: React.FC<OptimizedStoreFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  verifiedFilter,
  onVerifiedFilterChange,
  totalCount,
  isSearching = false
}) => {
  const getFilterCount = () => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (verifiedFilter !== 'all') count++;
    if (sortBy !== 'created_at' || sortOrder !== 'desc') count++;
    return count;
  };

  const clearFilters = () => {
    onSearchChange('');
    onVerifiedFilterChange('all');
    onSortChange('created_at');
    onSortOrderChange('desc');
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* Search and basic info */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск по названию, описанию, адресу..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Найдено: {totalCount}</span>
          {getFilterCount() > 0 && (
            <Badge variant="secondary" className="cursor-pointer" onClick={clearFilters}>
              Фильтров: {getFilterCount()} ✕
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Статус:</span>
          <Select value={verifiedFilter} onValueChange={onVerifiedFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все магазины</SelectItem>
              <SelectItem value="verified">Проверенные</SelectItem>
              <SelectItem value="unverified">Не проверенные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Сортировка:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">По дате создания</SelectItem>
              <SelectItem value="name">По названию</SelectItem>
              <SelectItem value="rating">По рейтингу</SelectItem>
              <SelectItem value="verified">По статусу</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={onSortOrderChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Убывание</SelectItem>
              <SelectItem value="asc">Возрастание</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default OptimizedStoreFilters;
