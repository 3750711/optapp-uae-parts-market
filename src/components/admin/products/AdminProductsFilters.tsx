
import React from 'react';
import SelectedProductsActions from '@/components/admin/filters/SelectedProductsActions';
import { OptimizedProductSearch } from '@/components/admin/search/OptimizedProductSearch';
import StatusFilter from '@/components/admin/filters/StatusFilter';
import DateRangeFilter from '@/components/admin/filters/DateRangeFilter';
import PriceRangeFilter from '@/components/admin/filters/PriceRangeFilter';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface AdminProductsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
  clearFilters: () => void;
  isLoading: boolean;
  isSearching?: boolean;
  hasActiveSearch?: boolean;
  hasActiveFilters?: boolean;
  selectedProducts: string[];
  onBulkStatusChange: (status: string) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onClearSelection: () => void;
}

const AdminProductsFilters: React.FC<AdminProductsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  priceRange,
  setPriceRange,
  clearFilters,
  isLoading,
  isSearching = false,
  hasActiveSearch = false,
  hasActiveFilters = false,
  selectedProducts,
  onBulkStatusChange,
  onBulkDelete,
  onClearSelection
}) => {
  console.log('🔍 AdminProductsFilters render:', { 
    searchTerm, 
    isSearching, 
    hasActiveSearch,
    hasActiveFilters,
    selectedCount: selectedProducts.length,
    statusFilter,
    dateRange,
    priceRange
  });

  const handleClearSearch = () => {
    console.log('🧹 Clearing search');
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <OptimizedProductSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
          hasActiveSearch={hasActiveSearch}
          placeholder="Поиск товаров по названию..."
          disabled={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            disabled={isLoading}
          />
          
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            disabled={isLoading}
          />
          
          <PriceRangeFilter
            value={priceRange}
            onChange={setPriceRange}
            disabled={isLoading}
          />
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              Очистить фильтры
            </Button>
          )}
        </div>
      </div>

      {/* Selected Products Actions */}
      {selectedProducts.length > 0 && (
        <SelectedProductsActions
          selectedCount={selectedProducts.length}
          onStatusChange={onBulkStatusChange}
          onDelete={onBulkDelete}
          onClearSelection={onClearSelection}
        />
      )}
    </div>
  );
};

export default AdminProductsFilters;
