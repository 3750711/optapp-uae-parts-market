import React, { useState } from 'react';
import { Search, X, Brain, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import SimpleCarSelector from '@/components/ui/SimpleCarSelector';

interface SimplifiedSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  isAISearching?: boolean;
  searchType?: 'ai' | 'fallback' | null;
}

const SimplifiedSearchBar: React.FC<SimplifiedSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  hideSoldProducts,
  setHideSoldProducts,
  isAISearching = false,
  searchType = null
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSubmit(e);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const clearSearch = () => {
    setSearchQuery('');
  };


  const getSearchTypeLabel = () => {
    if (isAISearching) {
      return '🧠 AI анализирует...';
    }
    
    switch (searchType) {
      case 'ai':
        return '🧠 AI поиск';
      case 'fallback':
        return '🔍 Текстовый поиск';
      default:
        return '';
    }
  };

  return (
    <Card className="mb-4">
      <div className="p-4 space-y-4">
        {/* AI Search Bar */}
        <form onSubmit={handleFormSubmit} className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <Brain className="h-4 w-4 text-primary mr-2" />
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Поиск товаров с помощью AI..."
              className="pl-16 pr-20 h-12 text-base bg-background border-input"
            />
            
            {/* Clear and Search buttons */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                type="submit"
                size="sm"
                disabled={isAISearching}
                className="h-8 px-3 bg-primary hover:bg-primary/90"
              >
                {isAISearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Hide sold products checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hide-sold"
              checked={hideSoldProducts}
              onCheckedChange={setHideSoldProducts}
              className="h-4 w-4"
            />
            <label
              htmlFor="hide-sold"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Скрыть проданные
            </label>
          </div>

          {/* Search type indicator and buyer guide link */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-primary" />
                <span>{getSearchTypeLabel()}</span>
              </div>
            </div>
            
            <Link 
              to="/buyer-guide" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Как покупать товар?
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SimplifiedSearchBar;