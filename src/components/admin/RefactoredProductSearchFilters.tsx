
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';

// Import our components
import SelectedProductsActions from './filters/SelectedProductsActions';

interface RefactoredProductSearchFiltersProps {
  // Sort states
  sortField: 'created_at' | 'price' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
  
  // Selected products state
  products: any[];
  selectedProducts: string[];
  isDeleting: boolean;
  
  // Event handlers
  setSortField: (field: 'created_at' | 'price' | 'title' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  
  onDeleteSelected: () => void;
  onToggleAllSelected: (selected: boolean) => void;
  resetAllFilters: () => void;
}

const RefactoredProductSearchFilters: React.FC<RefactoredProductSearchFiltersProps> = ({
  // Sort states
  sortField,
  sortOrder,
  
  // Selected products state
  products,
  selectedProducts,
  isDeleting,
  
  // Event handlers
  setSortField,
  setSortOrder,
  
  onDeleteSelected,
  onToggleAllSelected,
  resetAllFilters
}) => {
  // Export products to Excel
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
          {/* Sort Dropdown */}
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
          
          {/* Export Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 gap-2"
            onClick={exportToExcel}
            disabled={products.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Экспорт</span>
          </Button>
        </div>
      </div>
      
      {/* Selected Products Actions */}
      <SelectedProductsActions 
        selectedProducts={selectedProducts}
        onDeleteSelected={onDeleteSelected}
        isDeleting={isDeleting}
        onToggleAllSelected={onToggleAllSelected}
      />
    </div>
  );
};

export default RefactoredProductSearchFilters;
