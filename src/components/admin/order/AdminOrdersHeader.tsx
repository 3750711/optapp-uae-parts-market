
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortingControls, SortField, SortDirection } from "@/components/admin/order/SortingControls";
import OrderSearchFilters from '@/components/admin/filters/OrderSearchFilters';
import { useIsMobile } from "@/hooks/use-mobile";
import { Database } from "@/integrations/supabase/types";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

interface AdminOrdersHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
  onSearch: () => void;
  onClearSearch: () => void;
  statusFilter: StatusFilterType;
  onStatusFilterChange: (value: StatusFilterType) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

export const AdminOrdersHeader: React.FC<AdminOrdersHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  debouncedSearchTerm,
  onSearch,
  onClearSearch,
  statusFilter,
  onStatusFilterChange,
  sortField,
  sortDirection,
  onSortChange
}) => {
  const isMobile = useIsMobile();

  return (
    <CardHeader className="flex flex-col space-y-4 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Управление заказами
        </CardTitle>
        {!isMobile && (
          <div className="flex items-center gap-4">
            <SortingControls
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <Select
              value={statusFilter}
              onValueChange={onStatusFilterChange}
            >
              <SelectTrigger className="w-[200px] border-2 transition-colors hover:border-primary/50">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="created">Создан</SelectItem>
                <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
                <SelectItem value="admin_confirmed">Подтвержден администратором</SelectItem>
                <SelectItem value="processed">Зарегистрирован</SelectItem>
                <SelectItem value="shipped">Отправлен</SelectItem>
                <SelectItem value="delivered">Доставлен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <OrderSearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeSearchTerm={debouncedSearchTerm}
        onSearch={onSearch}
        onClearSearch={onClearSearch}
      />
    </CardHeader>
  );
};
