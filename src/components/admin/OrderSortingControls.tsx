
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface OrderSortingControlsProps {
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
}

export const OrderSortingControls: React.FC<OrderSortingControlsProps> = ({
  sortField,
  sortOrder,
  onSortChange
}) => {
  const sortOptions = [
    { value: 'created_at', label: 'Дата создания' },
    { value: 'order_number', label: 'Номер заказа' },
    { value: 'price', label: 'Цена' },
    { value: 'status', label: 'Статус' },
    { value: 'buyer_opt_id', label: 'ID покупателя' },
    { value: 'seller_opt_id', label: 'ID продавца' }
  ];

  const toggleSortOrder = () => {
    onSortChange(sortField, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={sortField} 
        onValueChange={(value) => onSortChange(value, sortOrder)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Сортировка" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortOrder}
        className="h-10 w-10"
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
