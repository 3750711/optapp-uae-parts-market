
import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounceValue } from '@/hooks/useDebounceValue';

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
  onOpenChange
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);

  const isSearching = searchTerm !== debouncedSearchTerm;

  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm) {
      return options;
    }
    return options.filter(option =>
      option.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [options, debouncedSearchTerm]);
  
  const selectedOption = options.find(o => o.id === value);

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    }
    // Сбрасываем поиск при закрытии
    if (!open) {
      setSearchTerm("");
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие дропдауна
            />
          </div>
        </div>
        <div className="max-h-[250px] overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Поиск...</span>
              </div>
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <SelectItem 
                key={option.id} 
                value={option.id}
              >
                {option.name}
              </SelectItem>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {searchTerm.trim() ? "Ничего не найдено" : "Нет доступных опций"}
            </p>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};

export default EnhancedVirtualizedSelect;
