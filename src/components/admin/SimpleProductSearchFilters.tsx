
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
  const [searchTerm, setSearchTerm] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  const handleFilterChange = () => {
    onSearchChange({
      searchTerm,
      lotNumber,
      priceFrom,
      priceTo
    });
  };

  React.useEffect(() => {
    handleFilterChange();
  }, [searchTerm, lotNumber, priceFrom, priceTo]);

  const handleClear = () => {
    setSearchTerm('');
    setLotNumber('');
    setPriceFrom('');
    setPriceTo('');
    onClearFilters();
  };

  const hasActiveFilters = searchTerm || lotNumber || priceFrom || priceTo;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Поиск и фильтры товаров
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Поиск по названию</Label>
            <Input
              id="search"
              placeholder="Введите название товара..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lot">Номер лота</Label>
            <Input
              id="lot"
              placeholder="Введите номер лота..."
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priceFrom">Цена от ($)</Label>
            <Input
              id="priceFrom"
              type="number"
              placeholder="Мин. цена"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priceTo">Цена до ($)</Label>
            <Input
              id="priceTo"
              type="number"
              placeholder="Макс. цена"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
            />
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClear}
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
