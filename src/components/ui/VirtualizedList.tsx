import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualItem {
  id: string;
  data: any;
  index: number;
}

interface VirtualizedListProps<T = any> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemId: (item: T, index: number) => string;
  onScrollEnd?: () => void;
  className?: string;
  emptyMessage?: React.ReactNode;
  loadingMessage?: React.ReactNode;
  isLoading?: boolean;
}

export function VirtualizedList<T = any>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  renderItem,
  getItemId,
  onScrollEnd,
  className,
  emptyMessage = "Нет элементов",
  loadingMessage = "Загрузка...",
  isLoading = false,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    const visible = items.slice(start, end + 1).map((item, idx) => ({
      id: getItemId(item, start + idx),
      data: item,
      index: start + idx,
    }));

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: visible,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan, getItemId]);

  // Handle scroll with debouncing
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    isScrollingRef.current = true;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      
      // Check if scrolled to bottom
      const { scrollHeight, clientHeight } = event.currentTarget;
      if (newScrollTop + clientHeight >= scrollHeight - 50) {
        onScrollEnd?.();
      }
    }, 150);
  }, [onScrollEnd]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to top when items change significantly
  useEffect(() => {
    if (containerRef.current && items.length > 0) {
      // Reset scroll position if items array changed dramatically
      const shouldReset = scrollTop > 0 && items.length < 10;
      if (shouldReset) {
        containerRef.current.scrollTop = 0;
        setScrollTop(0);
      }
    }
  }, [items.length]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)} style={{ height: containerHeight }}>
        <div className="text-center text-muted-foreground">
          {loadingMessage}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)} style={{ height: containerHeight }}>
        <div className="text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((virtualItem) => (
          <div
            key={virtualItem.id}
            style={{
              position: 'absolute',
              top: virtualItem.index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(virtualItem.data, virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Specialized virtualized select component
interface VirtualizedSelectProps<T = any> {
  items: T[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (item: T) => void;
  selectedItem?: T;
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  getItemId: (item: T, index: number) => string;
  placeholder?: string;
  maxHeight?: number;
  isLoading?: boolean;
  className?: string;
}

export function VirtualizedSelect<T = any>({
  items,
  searchTerm,
  onSearchChange,
  onSelect,
  selectedItem,
  renderItem,
  getItemId,
  placeholder = "Поиск...",
  maxHeight = 300,
  isLoading = false,
  className,
}: VirtualizedSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleItemClick = useCallback((item: T) => {
    onSelect(item);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onSelect]);

  const renderSelectItem = useCallback((item: T, index: number) => {
    const isSelected = selectedItem === item;
    return (
      <div
        className={cn(
          "cursor-pointer px-3 py-2 hover:bg-accent transition-colors",
          isSelected && "bg-accent text-accent-foreground"
        )}
        onClick={() => handleItemClick(item)}
      >
        {renderItem(item, index, isSelected)}
      </div>
    );
  }, [selectedItem, renderItem, handleItemClick]);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay to allow clicks
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      />
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-lg">
          <VirtualizedList
            items={items}
            itemHeight={40}
            containerHeight={Math.min(maxHeight, items.length * 40)}
            renderItem={renderSelectItem}
            getItemId={getItemId}
            isLoading={isLoading}
            emptyMessage="Нет результатов"
            loadingMessage="Поиск..."
          />
        </div>
      )}
    </div>
  );
}