import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface SimpleSearchBarProps {
  initialQuery?: string;
  onSubmit: (query: string) => void;
  isSearching?: boolean;
}

const SimpleSearchBar: React.FC<SimpleSearchBarProps> = ({
  initialQuery = '',
  onSubmit,
  isSearching = false
}) => {
  const [draft, setDraft] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(draft.trim());
  };

  const handleClear = () => {
    setDraft('');
    onSubmit('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Поиск по названию, бренду, модели, описанию, продавцу, номеру лота..."
          className="pl-10 pr-10 h-10 text-sm bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          autoComplete="off"
        />
        {draft && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50 transition-colors duration-200"
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button 
        type="submit" 
        disabled={isSearching}
        className="px-4 py-2 h-10 min-w-[80px] transition-all duration-200 hover:scale-105"
      >
        {isSearching ? (
          <span className="flex items-center gap-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="hidden sm:inline">Поиск...</span>
          </span>
        ) : (
          'Найти'
        )}
      </Button>
    </form>
  );
};

export default SimpleSearchBar;