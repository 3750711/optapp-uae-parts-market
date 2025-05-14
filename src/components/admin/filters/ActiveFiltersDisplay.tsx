
import React from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";
import { DateRange } from "./DateRangeFilter";

interface ActiveFiltersDisplayProps {
  filters: {
    priceRange: [number, number] | null;
    dateRange: DateRange | null;
    status: string | null;
  };
  onResetAll: () => void;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({ filters, onResetAll }) => {
  // Check if any filters are active
  const hasActiveFilters = filters.priceRange || filters.dateRange || filters.status;
  
  if (!hasActiveFilters) return null;
  
  // Map status codes to readable text
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает проверки';
      case 'active': return 'Опубликован';
      case 'sold': return 'Продан';
      case 'archived': return 'Архив';
      default: return status;
    }
  };

  return (
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
            Статус: {getStatusLabel(filters.status)}
          </span>
        </Badge>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 px-2" 
        onClick={onResetAll}
      >
        Сбросить все фильтры
      </Button>
    </div>
  );
};

export default ActiveFiltersDisplay;
