
import React, { useState, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Option {
  id: string;
  name: string;
}

interface VirtualizedSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  className?: string;
}

const VirtualizedSelect: React.FC<VirtualizedSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const listRef = useRef<List>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = useMemo(() => {
    return options.find(option => option.id === value);
  }, [options, value]);

  // Виртуализация нужна только для больших списков
  const shouldVirtualize = filteredOptions.length > 50;
  const itemHeight = isMobile ? 48 : 36;
  const maxHeight = isMobile ? 280 : 300;
  const listWidth = "100%";

  const VirtualizedItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const option = filteredOptions[index];
    return (
      <div style={style}>
        <SelectItem 
          key={option.id} 
          value={option.id}
          className={isMobile ? "py-3 text-base" : ""}
        >
          {option.name}
        </SelectItem>
      </div>
    );
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm("");
    }
  };

  if (!shouldVirtualize) {
    // Для небольших списков используем обычный Select с поиском
    return (
      <Select 
        value={value} 
        onValueChange={onValueChange} 
        disabled={disabled}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent 
          className={`max-h-[${maxHeight}px]`}
        >
          <div className="sticky top-0 px-1 pt-1 pb-0 z-10 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                className={`pl-8 ${isMobile ? "text-base py-2.5" : ""}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filteredOptions.map((option) => (
            <SelectItem 
              key={option.id} 
              value={option.id}
              className={isMobile ? "py-3 text-base" : ""}
            >
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Для больших списков используем виртуализацию
  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="p-0">
        <div className="sticky top-0 px-1 pt-1 pb-0 z-10 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              className={`pl-8 ${isMobile ? "text-base py-2.5" : ""}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div style={{ height: Math.min(filteredOptions.length * itemHeight, maxHeight) }}>
          <List
            ref={listRef}
            height={Math.min(filteredOptions.length * itemHeight, maxHeight)}
            itemCount={filteredOptions.length}
            itemSize={itemHeight}
            width={listWidth}
            className="scrollbar-thin scrollbar-thumb-gray-300"
          >
            {VirtualizedItem}
          </List>
        </div>
      </SelectContent>
    </Select>
  );
};

export default VirtualizedSelect;
