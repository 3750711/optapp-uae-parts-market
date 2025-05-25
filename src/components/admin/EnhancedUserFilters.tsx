
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Search, SlidersHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface FilterState {
  search: string;
  status: string;
  userType: string;
  optStatus: string;
  ratingFrom: string;
  ratingTo: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface EnhancedUserFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const EnhancedUserFilters: React.FC<EnhancedUserFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  activeFiltersCount
}) => {
  return (
    <div className="space-y-4">
      {/* Основная строка поиска */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, email, телеграм, телефону, компании..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Основные фильтры */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange('status', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="verified">Подтвержден</SelectItem>
            <SelectItem value="blocked">Заблокирован</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.userType}
          onValueChange={(value) => onFilterChange('userType', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="admin">Админ</SelectItem>
            <SelectItem value="seller">Продавец</SelectItem>
            <SelectItem value="buyer">Покупатель</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.optStatus}
          onValueChange={(value) => onFilterChange('optStatus', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="OPT статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все OPT</SelectItem>
            <SelectItem value="opt_user">OPT</SelectItem>
            <SelectItem value="free_user">Бесплатный</SelectItem>
          </SelectContent>
        </Select>

        {/* Расширенные фильтры */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Еще фильтры
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="font-medium">Дополнительные фильтры</div>
              
              {/* Рейтинг */}
              <div>
                <label className="text-sm font-medium">Рейтинг</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="От"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.ratingFrom}
                    onChange={(e) => onFilterChange('ratingFrom', e.target.value)}
                  />
                  <Input
                    placeholder="До"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.ratingTo}
                    onChange={(e) => onFilterChange('ratingTo', e.target.value)}
                  />
                </div>
              </div>

              {/* Дата регистрации */}
              <div>
                <label className="text-sm font-medium">Дата регистрации</label>
                <div className="flex gap-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        {filters.dateFrom ? format(filters.dateFrom, 'dd.MM.yyyy', { locale: ru }) : 'От даты'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => onFilterChange('dateFrom', date)}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        {filters.dateTo ? format(filters.dateTo, 'dd.MM.yyyy', { locale: ru }) : 'До даты'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => onFilterChange('dateTo', date)}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Очистить все
          </Button>
        )}
      </div>
    </div>
  );
};
