
import React from 'react';
import ProductSearchAndFilters from '@/components/admin/ProductSearchAndFilters';
import SelectedProductsActions from '@/components/admin/filters/SelectedProductsActions';

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
  selectedProducts,
  onBulkStatusChange,
  onBulkDelete,
  onClearSelection
}) => {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
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
      <SelectedProductsActions
        selectedCount={selectedProducts.length}
        onStatusChange={onBulkStatusChange}
        onDelete={onBulkDelete}
        onClearSelection={onClearSelection}
      />
    </div>
  );
};

export default AdminProductsFilters;
