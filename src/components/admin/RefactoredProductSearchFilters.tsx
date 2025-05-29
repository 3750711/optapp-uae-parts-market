
import React, { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import SearchBar from '@/components/admin/filters/SearchBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface RefactoredProductSearchFiltersProps {
  products: Product[];
  sortField: string;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  onSearch: () => void;
  onClearSearch: () => void;
  setSortField: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetAllFilters: () => void;
  selectedSellerId: string;
  setSelectedSellerId: (sellerId: string) => void;
  sellers: Array<{ id: string; name: string; }>;
}

const RefactoredProductSearchFilters: React.FC<RefactoredProductSearchFiltersProps> = ({
  products,
  sortField,
  sortOrder,
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearch,
  onClearSearch,
  setSortField,
  setSortOrder,
  resetAllFilters,
  selectedSellerId,
  setSelectedSellerId,
  sellers,
}) => {
  // Calculate the current sort value from the individual sort field and order
  const [sortValue, setSortValue] = useState(`${sortField}-${sortOrder}`);

  // Update the sort value whenever the sort field or order changes
  useEffect(() => {
    setSortValue(`${sortField}-${sortOrder}`);
  }, [sortField, sortOrder]);

  // Log the current sort state and sellers data
  useEffect(() => {
    console.log('Current sort state in filters component:', { sortField, sortOrder, sortValue });
    console.log('Sellers data:', sellers);
    console.log('Selected seller ID:', selectedSellerId);
  }, [sortField, sortOrder, sortValue, sellers, selectedSellerId]);

  // Handle sort change
  const handleSortChange = (newValue: string) => {
    console.log('Sort changed to:', newValue);
    // Extract field and order
    const [field, order] = newValue.split('-');
    
    // Update both the field and order
    setSortField(field);
    setSortOrder(order as 'asc' | 'desc');
    
    // Update the sort value state
    setSortValue(newValue);
  };

  // Handle seller selection
  const handleSellerChange = (sellerId: string) => {
    console.log('Seller filter changed to:', sellerId);
    // Convert "all" back to empty string for the actual filter
    const actualSellerId = sellerId === "all" ? "" : sellerId;
    setSelectedSellerId(actualSellerId);
  };

  // Get the display value for seller selector
  const getSellerDisplayValue = () => {
    return selectedSellerId === "" ? "all" : selectedSellerId;
  };

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr,auto,auto] items-start">
        <SearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={onSearch}
          onClear={onClearSearch}
          activeSearchTerm={activeSearchTerm}
        />
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={getSellerDisplayValue()} 
            onValueChange={handleSellerChange}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder="Все продавцы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все продавцы</SelectItem>
              {sellers.length > 0 ? (
                sellers.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="loading" disabled>
                  Загрузка продавцов...
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={sortValue} 
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status-asc">Статус (На проверке в начале)</SelectItem>
              <SelectItem value="status-desc">Статус (Архивные в начале)</SelectItem>
              <SelectItem value="price-asc">Цена (по возрастанию)</SelectItem>
              <SelectItem value="price-desc">Цена (по убыванию)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Debug info - remove this after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          Debug: {sellers.length} продавцов загружено, выбран: {selectedSellerId || 'не выбран'}
        </div>
      )}
    </div>
  );
};

export default RefactoredProductSearchFilters;
