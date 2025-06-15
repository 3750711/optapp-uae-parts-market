import React, { useState } from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X, Filter, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortingControls, SortField, SortDirection } from "./SortingControls";
import { Database } from "@/integrations/supabase/types";
import DateRangeFilter, { DateRange } from "@/components/admin/filters/DateRangeFilter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

interface MobileAdminOrdersHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
  onSearch: () => void;
  onClearSearch: () => void;
  statusFilter: StatusFilterType;
  onStatusFilterChange: (filter: StatusFilterType) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onRefetch: () => void;
  totalCount: number;
  isFetching?: boolean;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const MobileAdminOrdersHeader: React.FC<MobileAdminOrdersHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  debouncedSearchTerm,
  onSearch,
  onClearSearch,
  statusFilter,
  onStatusFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  onRefetch,
  totalCount,
  isFetching,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
      setIsSearchOpen(false);
    }
  };

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (debouncedSearchTerm ? 1 : 0) + (dateRange.from || dateRange.to ? 1 : 0);

  return (
    <CardHeader className="space-y-3 pb-4">
      {/* Main Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CardTitle className="text-lg font-bold truncate">Заказы</CardTitle>
          <Badge variant="secondary" className="text-xs shrink-0">
            {totalCount}
          </Badge>
          {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {/* Search Button */}
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 relative">
                <Search className="h-4 w-4" />
                {debouncedSearchTerm && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Поиск заказов</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск по названию, бренду, модели, номеру заказа, OPT ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-10"
                    autoFocus
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Button onClick={() => { onSearch(); setIsSearchOpen(false); }} className="w-full">
                  Найти
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Filters Button */}
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 relative">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>Фильтры и сортировка</SheetTitle>
                <SheetDescription>
                  Настройте отображение заказов
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                <DateRangeFilter
                  value={dateRange}
                  onChange={onDateRangeChange}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Статус заказа</label>
                  <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="created">Создан</SelectItem>
                      <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
                      <SelectItem value="admin_confirmed">Подтвержден админом</SelectItem>
                      <SelectItem value="processed">Зарегистрирован</SelectItem>
                      <SelectItem value="shipped">Отправлен</SelectItem>
                      <SelectItem value="delivered">Доставлен</SelectItem>
                      <SelectItem value="cancelled">Отменен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Сортировка</label>
                  <SortingControls
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={onSortChange}
                  />
                </div>

                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onClearFilters();
                      setIsFiltersOpen(false);
                    }}
                    className="w-full"
                  >
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Search Badge */}
      {debouncedSearchTerm && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Поиск: "{debouncedSearchTerm}"
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </CardHeader>
  );
};
