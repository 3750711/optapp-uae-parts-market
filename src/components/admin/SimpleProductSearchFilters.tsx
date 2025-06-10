
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";

export interface SearchFilters {
  searchTerm: string;
  lotNumber: string;
  priceFrom: string;
  priceTo: string;
}

interface SimpleProductSearchFiltersProps {
  onSearchChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

const SimpleProductSearchFilters: React.FC<SimpleProductSearchFiltersProps> = ({
  onSearchChange,
  onClearFilters
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    lotNumber: '',
    priceFrom: '',
    priceTo: ''
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearchChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: SearchFilters = {
      searchTerm: '',
      lotNumber: '',
      priceFrom: '',
      priceTo: ''
    };
    setFilters(emptyFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => value.trim() !== '');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Поиск товаров
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Поиск по названию</Label>
            <Input
              id="searchTerm"
              placeholder="Введите название товара..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lotNumber">Номер лота</Label>
            <Input
              id="lotNumber"
              placeholder="Номер лота"
              value={filters.lotNumber}
              onChange={(e) => handleFilterChange('lotNumber', e.target.value)}
              type="number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priceFrom">Цена от ($)</Label>
            <Input
              id="priceFrom"
              placeholder="Мин. цена"
              value={filters.priceFrom}
              onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
              type="number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priceTo">Цена до ($)</Label>
            <Input
              id="priceTo"
              placeholder="Макс. цена"
              value={filters.priceTo}
              onChange={(e) => handleFilterChange('priceTo', e.target.value)}
              type="number"
            />
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Очистить фильтры
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleProductSearchFilters;
