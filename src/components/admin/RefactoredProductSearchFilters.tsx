
import React, { useCallback, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchBar from './filters/SearchBar';
import * as XLSX from 'xlsx';

interface RefactoredProductSearchFiltersProps {
  // Sort states
  sortField: 'created_at' | 'price' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
  
  // Search states
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  
  // Data
  products: any[];
  
  // Event handlers
  setSortField: (field: 'created_at' | 'price' | 'title' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetAllFilters: () => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

// Используем memo для предотвращения лишних перерисовок
const RefactoredProductSearchFilters: React.FC<RefactoredProductSearchFiltersProps> = ({
  // Sort states
  sortField,
  sortOrder,
  
  // Search states
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  
  // Data
  products,
  
  // Event handlers
  setSortField,
  setSortOrder,
  resetAllFilters,
  onSearch,
  onClearSearch
}) => {
  // Export products to Excel - мемоизируем функцию
  const exportToExcel = useCallback(() => {
    if (products.length === 0) return;
    
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
  }, [products]);

  // Мемоизируем функцию обработки изменения сортировки
  const handleSortChange = useCallback((value: string) => {
    const [field, order] = value.split('-');
    setSortField(field as 'created_at' | 'price' | 'title' | 'status');
    setSortOrder(order as 'asc' | 'desc');
  }, [setSortField, setSortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Товары</h1>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-2">
          {/* Search Bar */}
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={onSearch}
            placeholder="Поиск товаров..."
          />
          
          {/* Sort Dropdown */}
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={handleSortChange}
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

      {/* Active Search Term Display */}
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
    </div>
  );
};

// Используем React.memo для предотвращения ненужных перерисовок
export default memo(RefactoredProductSearchFilters);
