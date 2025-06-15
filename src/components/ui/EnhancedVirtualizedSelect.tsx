
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  className?: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenChange?: (open: boolean) => void;
}

const EnhancedVirtualizedSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
  className = "",
  searchTerm,
  onSearchChange,
  onOpenChange
}) => {
  const selectedOption = options.find(o => o.id === value);

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    }
    // Сбрасываем поиск при закрытии
    if (!open) {
      onSearchChange("");
    }
  };

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {/* Показываем имя выбранной опции, если она есть в исходном (нефильтрованном) списке */}
          {selectedOption?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие дропдауна
            />
          </div>
        </div>
        <div className="max-h-[250px] overflow-y-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <SelectItem 
                key={option.id} 
                value={option.id}
              >
                {option.name}
              </SelectItem>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </p>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};

export default EnhancedVirtualizedSelect;
