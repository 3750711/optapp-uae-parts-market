import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import { PriceOfferStatus } from "@/types/price-offer";

interface AdminPriceOffersFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: PriceOfferStatus | 'all';
  onStatusFilterChange: (value: PriceOfferStatus | 'all') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
}

export const AdminPriceOffersFilters: React.FC<AdminPriceOffersFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  hasActiveFilters,
  isLoading
}) => {
  const statusOptions: { value: PriceOfferStatus | 'all'; label: string; color?: string }[] = [
    { value: 'all', label: 'Все статусы' },
    { value: 'pending', label: 'Ожидает', color: 'yellow' },
    { value: 'accepted', label: 'Принято', color: 'green' },
    { value: 'rejected', label: 'Отклонено', color: 'red' },
    { value: 'expired', label: 'Истекло', color: 'gray' },
    { value: 'cancelled', label: 'Отменено', color: 'gray' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск по товару, покупателю или продавцу..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange} disabled={isLoading}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.color && (
                    <div
                      className={`w-2 h-2 rounded-full bg-${option.color}-500`}
                    />
                  )}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Очистить
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Filter className="h-3 w-3" />
            Активные фильтры:
          </div>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Поиск: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-3 h-3"
                onClick={() => onSearchChange('')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Статус: {statusOptions.find(o => o.value === statusFilter)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-3 h-3"
                onClick={() => onStatusFilterChange('all')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};