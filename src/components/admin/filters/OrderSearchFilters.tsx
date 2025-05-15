
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import SearchBar from '@/components/admin/filters/SearchBar';
import ActiveSearchDisplay from '@/components/admin/filters/ActiveSearchDisplay';

interface OrderSearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  onSearch: () => void;
  onClearSearch: () => void;
}

const OrderSearchFilters: React.FC<OrderSearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearch,
  onClearSearch
}) => {
  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <SearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={onSearch}
          onClear={onClearSearch}
          activeSearchTerm={activeSearchTerm}
          placeholder="Поиск по номеру, названию, бренду..."
        />
        <ActiveSearchDisplay 
          searchTerm={activeSearchTerm} 
          onClear={onClearSearch} 
        />
      </CardContent>
    </Card>
  );
};

export default OrderSearchFilters;
