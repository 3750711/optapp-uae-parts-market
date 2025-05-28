
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Option {
  id: string;
  name: string;
}

interface EnhancedVirtualizedSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  className?: string;
  popularOptions?: string[];
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
  showResultCount?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
}

const EnhancedVirtualizedSelect: React.FC<EnhancedVirtualizedSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
  className = "",
  popularOptions = [],
  onSearchChange,
  searchTerm: externalSearchTerm,
  showResultCount = true,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Ничего не найдено",
  loadingMessage = "Поиск..."
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const isMobile = useIsMobile();
  const listRef = useRef<List>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = onSearchChange || setInternalSearchTerm;

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      // Show popular options first when no search
      if (popularOptions.length > 0) {
        const popular = options.filter(option => popularOptions.includes(option.id));
        const regular = options.filter(option => !popularOptions.includes(option.id));
        return [...popular, ...regular];
      }
      return options;
    }

    const filtered = options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Even in search results, show popular options first
    if (popularOptions.length > 0) {
      const popular = filtered.filter(option => popularOptions.includes(option.id));
      const regular = filtered.filter(option => !popularOptions.includes(option.id));
      return [...popular, ...regular];
    }

    return filtered;
  }, [options, searchTerm, popularOptions]);

  const selectedOption = useMemo(() => {
    return options.find(option => option.id === value);
  }, [options, value]);

  const shouldVirtualize = filteredOptions.length > 50;
  const itemHeight = isMobile ? 48 : 36;
  const maxHeight = isMobile ? 280 : 300;

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current && !isMobile) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile]);

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchTerm]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          onValueChange(filteredOptions[focusedIndex].id);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, focusedIndex, filteredOptions, onValueChange]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFocusedIndex(-1);
      // Не очищаем поиск при закрытии для сохранения состояния
    }
  };

  const ResultCountDisplay = () => {
    if (!showResultCount) return null;

    if (isLoading) {
      return (
        <div className="px-2 py-1 text-xs text-muted-foreground flex items-center">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {loadingMessage}
        </div>
      );
    }

    if (isEmpty && searchTerm) {
      return (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    if (searchTerm) {
      return (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Найдено: {filteredOptions.length}
        </div>
      );
    }

    return (
      <div className="px-2 py-1 text-xs text-muted-foreground">
        Всего: {options.length}
        {popularOptions.length > 0 && (
          <span className="ml-2">★ популярные</span>
        )}
      </div>
    );
  };

  const VirtualizedItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const option = filteredOptions[index];
    const isPopular = popularOptions.includes(option.id);
    const isFocused = index === focusedIndex;
    
    return (
      <div style={style}>
        <SelectItem 
          key={option.id} 
          value={option.id}
          className={`
            ${isMobile ? "py-3 text-base" : ""} 
            ${isFocused ? "bg-accent" : ""}
            ${isPopular && !searchTerm ? "font-medium text-primary" : ""}
          `}
        >
          {option.name}
          {isPopular && !searchTerm && (
            <span className="ml-2 text-xs text-muted-foreground">★</span>
          )}
        </SelectItem>
      </div>
    );
  };

  if (!shouldVirtualize) {
    return (
      <div onKeyDown={handleKeyDown}>
        <Select 
          value={value} 
          onValueChange={onValueChange} 
          disabled={disabled}
          onOpenChange={handleOpenChange}
        >
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectTrigger>
          <SelectContent 
            className={`max-h-[${maxHeight}px]`}
          >
            <div className="sticky top-0 px-1 pt-1 pb-0 z-10 bg-background border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  placeholder={searchPlaceholder}
                  className={`pl-8 ${isMobile ? "text-base py-2.5" : ""}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <ResultCountDisplay />
            </div>
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mx-auto mb-2 animate-spin" />
                {loadingMessage}
              </div>
            ) : isEmpty && searchTerm ? (
              <div className="p-4 text-center text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isPopular = popularOptions.includes(option.id);
                const isFocused = index === focusedIndex;
                
                return (
                  <SelectItem 
                    key={option.id} 
                    value={option.id}
                    className={`
                      ${isMobile ? "py-3 text-base" : ""} 
                      ${isFocused ? "bg-accent" : ""}
                      ${isPopular && !searchTerm ? "font-medium text-primary" : ""}
                    `}
                  >
                    {option.name}
                    {isPopular && !searchTerm && (
                      <span className="ml-2 text-xs text-muted-foreground">★</span>
                    )}
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <Select 
        value={value} 
        onValueChange={onValueChange} 
        disabled={disabled}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectTrigger>
        <SelectContent className="p-0">
          <div className="sticky top-0 px-1 pt-1 pb-0 z-10 bg-background border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                className={`pl-8 ${isMobile ? "text-base py-2.5" : ""}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ResultCountDisplay />
          </div>
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="w-4 h-4 mx-auto mb-2 animate-spin" />
              {loadingMessage}
            </div>
          ) : isEmpty && searchTerm ? (
            <div className="p-4 text-center text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div style={{ height: Math.min(filteredOptions.length * itemHeight, maxHeight) }}>
              <List
                ref={listRef}
                height={Math.min(filteredOptions.length * itemHeight, maxHeight)}
                itemCount={filteredOptions.length}
                itemSize={itemHeight}
                width="100%"
                className="scrollbar-thin scrollbar-thumb-gray-300"
              >
                {VirtualizedItem}
              </List>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EnhancedVirtualizedSelect;
