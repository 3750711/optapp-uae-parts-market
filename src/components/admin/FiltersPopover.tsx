
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import StatusFilter from '@/components/admin/filters/StatusFilter';
import SellerFilter from '@/components/admin/filters/SellerFilter';
import { FiltersState } from '@/hooks/useProductFilters';

interface FiltersPopoverProps {
  filters: FiltersState;
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  sellerFilter: string;
  setSellerFilter: (sellerId: string) => void;
  sellers: Array<{ id: string; name: string; }>;
  resetAllFilters: () => void;
  applyFilters: () => void;
  disabled?: boolean;
}

const FiltersPopover: React.FC<FiltersPopoverProps> = ({
  filters,
  statusFilter,
  setStatusFilter,
  sellerFilter,
  setSellerFilter,
  sellers,
  resetAllFilters,
  applyFilters,
  disabled = false
}) => {
  const hasActiveFilters = Boolean(
    statusFilter || 
    (sellerFilter && sellerFilter !== 'all')
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 gap-2"
          disabled={disabled}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Фильтры</span>
          {hasActiveFilters && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full ml-1 bg-primary">
              <span className="text-xs">!</span>
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium mb-2">Фильтры</h4>
          
          {/* Status Filter */}
          <StatusFilter 
            value={statusFilter || 'all'}
            onChange={(status) => setStatusFilter(status === 'all' ? null : status)}
            disabled={disabled}
          />
          
          {/* Seller Filter */}
          <SellerFilter 
            value={sellerFilter}
            onChange={setSellerFilter}
            sellers={sellers}
            disabled={disabled}
          />
          
          {/* Action Buttons */}
          <div className="flex justify-end pt-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetAllFilters}
              disabled={disabled}
            >
              Сбросить
            </Button>
            <Button 
              size="sm"
              onClick={applyFilters}
              disabled={disabled}
            >
              Применить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FiltersPopover;
