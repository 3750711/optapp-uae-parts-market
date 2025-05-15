
import React, { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import SearchBar from '@/components/admin/filters/SearchBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [isExpanded, setIsExpanded] = useState(false);

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
          <Collapsible 
            className="w-full"
            open={isExpanded} 
            onOpenChange={setIsExpanded}
          >
            <div className="flex items-center gap-2 w-full">
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
              
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="mt-2 space-y-2 border-t pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={sortValue === "status-asc" ? "default" : "outline"}
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleSortChange("status-asc")}
                >
                  Статус (На проверке в начале)
                </Button>
                <Button
                  variant={sortValue === "status-desc" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSortChange("status-desc")}
                >
                  Статус (Архивные в начале)
                </Button>
                <Button
                  variant={sortValue === "price-asc" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSortChange("price-asc")}
                >
                  Цена (по возрастанию)
                </Button>
                <Button
                  variant={sortValue === "price-desc" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleSortChange("price-desc")}
                >
                  Цена (по убыванию)
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default RefactoredProductSearchFilters;
