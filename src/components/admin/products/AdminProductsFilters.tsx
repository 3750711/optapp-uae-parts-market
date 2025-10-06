import React from 'react';
import SelectedProductsActions from '@/components/admin/filters/SelectedProductsActions';
import { OptimizedProductSearch } from '@/components/admin/search/OptimizedProductSearch';
import StatusFilter from '@/components/admin/filters/StatusFilter';
import SellerFilter from '@/components/admin/filters/SellerFilter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X, AlertCircle } from "lucide-react";

interface AdminProductsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sellerFilter: string;
  setSellerFilter: (sellerId: string) => void;
  notificationIssuesFilter?: boolean;
  setNotificationIssuesFilter?: (enabled: boolean) => void;
  sellers: Array<{ id: string; name: string; opt_id?: string; }>;
  clearFilters: () => void;
  isLoading: boolean;
  isSearching?: boolean;
  hasActiveSearch?: boolean;
  hasActiveFilters?: boolean;
  selectedProducts: string[];
  onBulkStatusChange: (status: string) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onClearSelection: () => void;
}

const AdminProductsFilters: React.FC<AdminProductsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sellerFilter,
  setSellerFilter,
  notificationIssuesFilter = false,
  setNotificationIssuesFilter,
  sellers,
  clearFilters,
  isLoading,
  isSearching = false,
  hasActiveSearch = false,
  hasActiveFilters = false,
  selectedProducts,
  onBulkStatusChange,
  onBulkDelete,
  onClearSelection
}) => {
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Optimized Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <OptimizedProductSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={handleClearSearch}
          isSearching={isSearching}
          hasActiveSearch={hasActiveSearch}
          placeholder="Поиск товаров по названию..."
          disabled={isLoading}
        />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
            
            <SellerFilter
              value={sellerFilter}
              onChange={setSellerFilter}
              sellers={sellers}
              disabled={isLoading}
            />
          </div>
          
          {/* Notification Issues Filter */}
          <div className="mt-4 flex items-center gap-2">
            <Button 
              variant={notificationIssuesFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setNotificationIssuesFilter?.(!notificationIssuesFilter)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {notificationIssuesFilter ? 'Показаны только проблемные' : 'Показать проблемные уведомления'}
            </Button>
            {notificationIssuesFilter && (
              <Badge variant="destructive" className="text-xs">
                Активен фильтр проблем
              </Badge>
            )}
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

      {/* Selected Products Actions */}
      {selectedProducts.length > 0 && (
        <SelectedProductsActions
          selectedCount={selectedProducts.length}
          onStatusChange={onBulkStatusChange}
          onDelete={onBulkDelete}
          onClearSelection={onClearSelection}
        />
      )}
    </div>
  );
};

export default AdminProductsFilters;
