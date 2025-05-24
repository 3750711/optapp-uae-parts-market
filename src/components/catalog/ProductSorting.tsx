
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

interface ProductSortingProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  className?: string;
}

const ProductSorting: React.FC<ProductSortingProps> = ({
  sortBy,
  onSortChange,
  className = ""
}) => {
  const sortOptions = [
    { value: 'newest' as SortOption, label: 'Новые' },
    { value: 'oldest' as SortOption, label: 'Старые' },
    { value: 'price_asc' as SortOption, label: 'Цена: по возрастанию' },
    { value: 'price_desc' as SortOption, label: 'Цена: по убыванию' },
    { value: 'name_asc' as SortOption, label: 'По алфавиту А-Я' },
    { value: 'name_desc' as SortOption, label: 'По алфавиту Я-А' }
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown className="h-4 w-4 text-gray-500" />
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[200px] bg-white">
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
    </div>
  );
};

export default ProductSorting;
