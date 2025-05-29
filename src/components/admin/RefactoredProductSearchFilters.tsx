
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
}) => {
  // Calculate the current sort value from the individual sort field and order
  const [sortValue, setSortValue] = useState(`${sortField}-${sortOrder}`);

  // Update the sort value whenever the sort field or order changes
  useEffect(() => {
    setSortValue(`${sortField}-${sortOrder}`);
  }, [sortField, sortOrder]);

  // Log the current sort state
  useEffect(() => {
    console.log('Current sort state in filters component:', { sortField, sortOrder, sortValue });
  }, [sortField, sortOrder, sortValue]);

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

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr,auto] items-start">
        <SearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={onSearch}
          onClear={onClearSearch}
          activeSearchTerm={activeSearchTerm}
        />
        
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
              <SelectItem value="seller_name-asc">Продавец (А-Я)</SelectItem>
              <SelectItem value="seller_name-desc">Продавец (Я-А)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default RefactoredProductSearchFilters;
