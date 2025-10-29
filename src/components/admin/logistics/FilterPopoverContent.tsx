import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterOption } from '@/types/logisticsFilters';

interface FilterPopoverContentProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

export const FilterPopoverContent: React.FC<FilterPopoverContentProps> = ({
  title,
  options,
  selectedValues,
  onToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтруем опции по поисковому запросу
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium mb-2">{title}</h4>
        {options.length > 5 && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
        )}
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2 pr-4">
          {filteredOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${title}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              <label
                htmlFor={`${title}-${option.value}`}
                className="text-sm flex-1 cursor-pointer select-none"
              >
                {option.label}
                {option.count !== undefined && (
                  <span className="text-muted-foreground ml-1">
                    ({option.count})
                  </span>
                )}
              </label>
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Ничего не найдено
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-between items-center pt-2 border-t">
        <span className="text-xs text-muted-foreground">
          Выбрано: {selectedValues.length}
        </span>
        {selectedValues.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedValues.forEach(v => onToggle(v))}
            className="h-7 text-xs"
          >
            Очистить
          </Button>
        )}
      </div>
    </div>
  );
};
