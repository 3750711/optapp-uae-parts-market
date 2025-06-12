
import React from 'react';
import ProductSearchAndFilters from '@/components/admin/ProductSearchAndFilters';
import SelectedProductsActions from '@/components/admin/filters/SelectedProductsActions';
import { OptimizedProductSearch } from '@/components/admin/search/OptimizedProductSearch';

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
    selectedCount: selectedProducts.length 
  });

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Optimized Search */}
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

      {/* Advanced Filters */}
      <ProductSearchAndFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        clearFilters={clearFilters}
        isLoading={isLoading}
      />

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
