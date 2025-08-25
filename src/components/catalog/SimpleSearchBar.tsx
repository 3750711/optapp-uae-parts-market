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
          placeholder="Поиск по названию, бренду, модели..."
          className="pl-10 pr-10"
          autoComplete="off"
        />
        {draft && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit" disabled={isSearching}>
        {isSearching ? 'Поиск...' : 'Найти'}
      </Button>
    </form>
  );
};

export default SimpleSearchBar;