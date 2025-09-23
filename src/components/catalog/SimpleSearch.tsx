import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

interface SimpleSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (query: string) => void;
  isSearching?: boolean;
  placeholder?: string;
}

const SimpleSearch: React.FC<SimpleSearchProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching = false,
  placeholder = "Поиск автозапчастей..."
}) => {
  // Debounce search with 500ms delay for smooth UX
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Trigger search when debounced value changes
  React.useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      onSearch(debouncedSearchQuery);
    } else if (debouncedSearchQuery === '') {
      onSearch('');
    }
  }, [debouncedSearchQuery, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        
        {/* Search Input */}
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base bg-background border-input"
        />
        
        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Loading indicator */}
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          
          {/* Clear button */}
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0"
              title="Очистить"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default SimpleSearch;