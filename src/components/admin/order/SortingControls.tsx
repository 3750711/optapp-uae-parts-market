
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

export type SortField = 
  | 'created_at' 
  | 'order_number' 
  | 'price' 
  | 'status' 
  | 'seller_name' 
  | 'buyer_name'
  | 'delivery_price_confirm';

export type SortDirection = 'asc' | 'desc';

interface SortingControlsProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

export const SortingControls: React.FC<SortingControlsProps> = ({
  sortField,
  sortDirection,
  onSortChange
}) => {
  const sortOptions = [
    { value: 'created_at', label: 'Дата создания' },
    { value: 'order_number', label: 'Номер заказа' },
    { value: 'price', label: 'Цена товара' },
    { value: 'delivery_price_confirm', label: 'Цена доставки' },
    { value: 'status', label: 'Статус' },
    { value: 'seller_name', label: 'Продавец' },
    { value: 'buyer_name', label: 'Покупатель' }
  ];

  const toggleDirection = () => {
    onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Select 
        value={sortField} 
        onValueChange={(value) => onSortChange(value as SortField, sortDirection)}
      >
        <SelectTrigger className="w-full sm:w-[180px] border-2 transition-colors hover:border-primary/50">
          <SelectValue placeholder="Сортировка" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDirection}
        className="flex items-center gap-1 hover:bg-primary/10"
      >
        {sortDirection === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
        <span className="hidden md:inline">{sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}</span>
      </Button>
    </div>
  );
};
