
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface PriceRange {
  min: number;
  max: number;
}

interface ProductSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  priceRange: PriceRange;
  setPriceRange: (range: PriceRange) => void;
  clearFilters: () => void;
  isLoading: boolean;
}

const ProductSearchAndFilters: React.FC<ProductSearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  priceRange,
  setPriceRange,
  clearFilters,
  isLoading
}) => {
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to || priceRange.min > 0 || priceRange.max < 100000;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Поиск и фильтры
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
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает проверки</SelectItem>
                <SelectItem value="active">Активный</SelectItem>
                <SelectItem value="sold">Продан</SelectItem>
                <SelectItem value="archived">Архив</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Цена от ($)</Label>
            <Input
              type="number"
              placeholder="Мин. цена"
              value={priceRange.min || ''}
              onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Цена до ($)</Label>
            <Input
              type="number"
              placeholder="Макс. цена"
              value={priceRange.max === 100000 ? '' : priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 100000 })}
            />
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
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

export default ProductSearchAndFilters;
