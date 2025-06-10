
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface ProductSearchAndFiltersProps {
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
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to || 
    priceRange.min > 0 || priceRange.max < 100000;

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
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидание</SelectItem>
                <SelectItem value="published">Опубликован</SelectItem>
                <SelectItem value="sold">Продан</SelectItem>
                <SelectItem value="blocked">Заблокирован</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priceFrom">Цена от ($)</Label>
            <Input
              id="priceFrom"
              placeholder="Мин. цена"
              value={priceRange.min || ''}
              onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
              type="number"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priceTo">Цена до ($)</Label>
            <Input
              id="priceTo"
              placeholder="Макс. цена"
              value={priceRange.max === 100000 ? '' : priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 100000 })}
              type="number"
              disabled={isLoading}
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
              disabled={isLoading}
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
