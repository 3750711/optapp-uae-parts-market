
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAdminOrdersHeader } from './MobileAdminOrdersHeader';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, X, SortAsc, SortDesc } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortingControls, SortField, SortDirection } from "./SortingControls";
import { Database } from "@/integrations/supabase/types";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

interface AdminOrdersHeaderProps {
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
  totalCount?: number;
}

export const AdminOrdersHeader: React.FC<AdminOrdersHeaderProps> = (props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileAdminOrdersHeader {...props} totalCount={props.totalCount || 0} />;
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      props.onSearch();
    }
  };

  return (
    <CardHeader className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-bold">Заказы</CardTitle>
          {props.debouncedSearchTerm && (
            <Badge variant="secondary" className="text-xs">
              Поиск: "{props.debouncedSearchTerm}"
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск по названию, бренду, модели, номеру заказа, OPT ID..."
            value={props.searchTerm}
            onChange={(e) => props.setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-10"
          />
          {props.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={props.onClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={props.statusFilter} onValueChange={props.onStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="created">Создан</SelectItem>
              <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
              <SelectItem value="admin_confirmed">Подтвержден админом</SelectItem>
              <SelectItem value="in_transit">В пути</SelectItem>
              <SelectItem value="delivered">Доставлен</SelectItem>
              <SelectItem value="cancelled">Отменен</SelectItem>
            </SelectContent>
          </Select>

          <SortingControls
            sortField={props.sortField}
            sortDirection={props.sortDirection}
            onSortChange={props.onSortChange}
          />
        </div>
      </div>
    </CardHeader>
  );
};
