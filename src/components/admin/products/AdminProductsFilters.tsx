
import React from 'react';
import SelectedProductsActions from '@/components/admin/filters/SelectedProductsActions';
import { OptimizedProductSearch } from '@/components/admin/search/OptimizedProductSearch';
import StatusFilter from '@/components/admin/filters/StatusFilter';
import SellerFilter from '@/components/admin/filters/SellerFilter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

interface AdminProductsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sellerFilter: string;
  setSellerFilter: (sellerId: string) => void;
  sellers: Array<{ id: string; name: string; }>;
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
  sellerFilter,
  setSellerFilter,
  sellers,
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

      {/* Filters */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
            
            <SellerFilter
              value={sellerFilter}
              onChange={setSellerFilter}
              sellers={sellers}
              disabled={isLoading}
            />
          </div>
          
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                Очистить фильтры
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
