
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FixedSizeList as List } from 'react-window';

interface Option {
  value: string;
  label: string;
  searchText?: string;
}

interface OptimizedSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: number;
  itemHeight?: number;
}

const OptimizedSelect: React.FC<OptimizedSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Выберите опцию...",
  searchPlaceholder = "Поиск...",
  className,
  disabled = false,
  maxHeight = 200,
  itemHeight = 35
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef<any>(null);

  // Filtered options with memoization
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    
    const term = searchTerm.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(term) ||
      option.searchText?.toLowerCase().includes(term) ||
      option.value.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const selectedOption = options.find(option => option.value === value);

  // Reset search when opening/closing
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  // Scroll to selected item when opening
  useEffect(() => {
    if (open && selectedOption && listRef.current) {
      const index = filteredOptions.findIndex(option => option.value === value);
      if (index >= 0) {
        listRef.current.scrollToItem(index, 'center');
      }
    }
  }, [open, selectedOption, filteredOptions, value]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  // Virtualized item renderer
  const Item = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const option = filteredOptions[index];
    const isSelected = option.value === value;

    return (
      <div style={style}>
        <CommandItem
          value={option.value}
          onSelect={() => handleSelect(option.value)}
          className={cn(
            "flex items-center justify-between cursor-pointer px-3 py-2 text-sm",
            isSelected && "bg-accent text-accent-foreground"
          )}
        >
          <span className="truncate">{option.label}</span>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </CommandItem>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>Ничего не найдено</CommandEmpty>
            ) : (
              <List
                ref={listRef}
                height={Math.min(maxHeight, filteredOptions.length * itemHeight)}
                itemCount={filteredOptions.length}
                itemSize={itemHeight}
                className="overflow-auto"
              >
                {Item}
              </List>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default OptimizedSelect;
