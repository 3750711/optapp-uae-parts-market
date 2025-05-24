
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { StoreFilters as FilterType } from '@/hooks/useAdminStores';

interface StoreFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  totalStores: number;
  filteredCount: number;
}

const StoreFilters: React.FC<StoreFiltersProps> = ({
  filters,
  onFiltersChange,
  totalStores,
  filteredCount
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      verified: 'all',
      hasLocation: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = filters.search || filters.verified !== 'all' || filters.hasLocation !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск по названию, адресу или владельцу..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Verified Filter */}
        <Select
          value={filters.verified}
          onValueChange={(value) => handleFilterChange('verified', value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Статус проверки" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все магазины</SelectItem>
            <SelectItem value="verified">Проверенные</SelectItem>
            <SelectItem value="unverified">Не проверенные</SelectItem>
          </SelectContent>
        </Select>

        {/* Location Filter */}
        <Select
          value={filters.hasLocation}
          onValueChange={(value) => handleFilterChange('hasLocation', value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Наличие города" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="with">С городом</SelectItem>
            <SelectItem value="without">Без города</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Options */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">По названию</SelectItem>
              <SelectItem value="created_at">По дате создания</SelectItem>
              <SelectItem value="rating">По рейтингу</SelectItem>
              <SelectItem value="verified">По статусу</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortOrder}
            onValueChange={(value) => handleFilterChange('sortOrder', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">По возрастанию</SelectItem>
              <SelectItem value="desc">По убыванию</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Сбросить фильтры
            </Button>
          )}

          <div className="text-sm text-muted-foreground">
            {filteredCount !== totalStores ? (
              <>Показано {filteredCount} из {totalStores} магазинов</>
            ) : (
              <>Всего магазинов: {totalStores}</>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Поиск: "{filters.search}"
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleSearchChange('')}
              />
            </Badge>
          )}
          {filters.verified !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Статус: {filters.verified === 'verified' ? 'Проверенные' : 'Не проверенные'}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleFilterChange('verified', 'all')}
              />
            </Badge>
          )}
          {filters.hasLocation !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Город: {filters.hasLocation === 'with' ? 'С городом' : 'Без города'}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleFilterChange('hasLocation', 'all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreFilters;
