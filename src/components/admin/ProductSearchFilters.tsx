
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter, Download, Trash2, CheckCircle, Clock, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface ProductSearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  setActiveSearchTerm: (term: string) => void;
  sortField: 'created_at' | 'price' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
  setSortField: (field: 'created_at' | 'price' | 'title' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  onSearch: () => void;
  onClearSearch: () => void;
  products: any[];
  selectedProducts: string[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
  onToggleAllSelected: (selected: boolean) => void;
  // Дополнительные фильтры
  filters: {
    priceRange: [number, number] | null;
    dateRange: { from: Date | null; to: Date | null } | null;
    status: string | null;
  };
  setFilters: (filters: any) => void;
  onApplyFilters: () => void;
}

const ProductSearchFilters: React.FC<ProductSearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  setActiveSearchTerm,
  sortField,
  sortOrder,
  setSortField,
  setSortOrder,
  onSearch,
  onClearSearch,
  products,
  selectedProducts,
  onDeleteSelected,
  isDeleting,
  onToggleAllSelected,
  filters,
  setFilters,
  onApplyFilters
}) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Загрузка диапазона цен из товаров для настройки слайдера
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price).filter(Boolean);
      const max = Math.max(...prices, 1000);
      setMaxPrice(max);
      setPriceRange([0, max]);
    }
  }, [products]);

  // Обработчик изменения фильтров
  useEffect(() => {
    setFilters({
      priceRange: priceRange[0] === 0 && priceRange[1] === maxPrice ? null : priceRange,
      dateRange: dateRange.from || dateRange.to ? dateRange : null,
      status: statusFilter
    });
  }, [priceRange, dateRange, statusFilter, maxPrice]);

  // Обработчик нажатия на Enter в поле поиска
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // Экспорт товаров в Excel
  const exportToExcel = () => {
    const exportData = products.map(product => ({
      'ID товара': product.id,
      'Название': product.title,
      'Бренд': product.brand || '',
      'Модель': product.model || '',
      'Цена': product.price,
      'Цена доставки': product.delivery_price || 0,
      'Статус': product.status,
      'Продавец': product.seller_name,
      'OPT ID': product.optid_created || '',
      'Дата создания': product.created_at ? new Date(product.created_at).toLocaleString() : '',
      'Лот номер': product.lot_number || '',
      'Описание': product.description || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `product_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Товары</h1>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-2">
          {/* Поиск */}
          <div className="relative flex items-center w-full md:w-auto">
            <Input
              type="search"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full md:w-[300px] pr-10"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 h-10"
              onClick={onSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Сортировка */}
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortField(field as 'created_at' | 'price' | 'title' | 'status');
              setSortOrder(order as 'asc' | 'desc');
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status-asc">Сначала ожидает проверки</SelectItem>
              <SelectItem value="created_at-desc">Сначала новые</SelectItem>
              <SelectItem value="created_at-asc">Сначала старые</SelectItem>
              <SelectItem value="price-desc">Цена по убыванию</SelectItem>
              <SelectItem value="price-asc">Цена по возрастанию</SelectItem>
              <SelectItem value="title-asc">По названию А-Я</SelectItem>
              <SelectItem value="title-desc">По названию Я-А</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Попап с расширенными фильтрами */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 gap-2"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Фильтры</span>
                {(filters.priceRange || filters.dateRange || filters.status) && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full ml-1 bg-primary">
                    <span className="text-xs">!</span>
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-2">Фильтры</h4>
                
                {/* Фильтр по цене */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Диапазон цен ($)</label>
                    <div className="text-xs text-muted-foreground">
                      {priceRange[0]} - {priceRange[1]}
                    </div>
                  </div>
                  <Slider
                    value={priceRange}
                    min={0}
                    max={maxPrice}
                    step={10}
                    onValueChange={(value: [number, number]) => setPriceRange(value)}
                    className="py-4"
                  />
                </div>
                
                {/* Фильтр по дате */}
                <div className="space-y-2">
                  <label className="text-sm">Дата создания</label>
                  <div className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.from && !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            "Выберите даты"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from || new Date()}
                          selected={{
                            from: dateRange.from,
                            to: dateRange.to,
                          }}
                          onSelect={(selectedDateRange) => {
                            setDateRange(selectedDateRange || { from: null, to: null });
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Фильтр по статусу */}
                <div className="space-y-2">
                  <label className="text-sm">Статус товара</label>
                  <Select
                    value={statusFilter || ""}
                    onValueChange={(value) => setStatusFilter(value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все статусы</SelectItem>
                      <SelectItem value="pending">Ожидает проверки</SelectItem>
                      <SelectItem value="active">Опубликован</SelectItem>
                      <SelectItem value="sold">Продан</SelectItem>
                      <SelectItem value="archived">Архив</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Кнопки действий */}
                <div className="flex justify-end pt-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPriceRange([0, maxPrice]);
                      setDateRange({ from: null, to: null });
                      setStatusFilter(null);
                    }}
                  >
                    Сбросить
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      onApplyFilters();
                    }}
                  >
                    Применить
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Кнопка экспорта */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 gap-2"
            onClick={exportToExcel}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Экспорт</span>
          </Button>
        </div>
      </div>

      {/* Индикатор поискового запроса */}
      {activeSearchTerm && (
        <div className="flex items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Поиск по запросу: <span className="font-medium text-foreground">{activeSearchTerm}</span>
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-6" 
            onClick={onClearSearch}
          >
            Сбросить
          </Button>
        </div>
      )}

      {/* Индикатор активных фильтров */}
      {(filters.priceRange || filters.dateRange || filters.status) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Активные фильтры:</span>
          
          {filters.priceRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>Цена: {filters.priceRange[0]} - {filters.priceRange[1]} $</span>
            </Badge>
          )}
          
          {filters.dateRange?.from && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                Дата: {filters.dateRange.from ? format(filters.dateRange.from, "dd/MM/yyyy") : ''} 
                {filters.dateRange.to ? ` - ${format(filters.dateRange.to, "dd/MM/yyyy")}` : ''}
              </span>
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>
                Статус: {
                  filters.status === 'pending' ? 'Ожидает проверки' :
                  filters.status === 'active' ? 'Опубликован' :
                  filters.status === 'sold' ? 'Продан' :
                  filters.status === 'archived' ? 'Архив' : filters.status
                }
              </span>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2" 
            onClick={() => {
              setFilters({ priceRange: null, dateRange: null, status: null });
              setPriceRange([0, maxPrice]);
              setDateRange({ from: null, to: null });
              setStatusFilter(null);
              onApplyFilters();
            }}
          >
            Сбросить все фильтры
          </Button>
        </div>
      )}
      
      {/* Панель действий с выбранными товарами */}
      {selectedProducts.length > 0 && (
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={selectedProducts.length > 0} 
              onChange={(e) => onToggleAllSelected(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">
              Выбрано товаров: {selectedProducts.length}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>Удалить выбранные</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearchFilters;
