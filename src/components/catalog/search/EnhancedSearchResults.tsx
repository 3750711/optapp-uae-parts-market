import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, Clock, Search } from 'lucide-react';

interface EnhancedSearchResultsProps {
  searchQuery: string;
  resultCount: number;
  isSearching: boolean;
  searchTime?: number; // in milliseconds
}

const EnhancedSearchResults: React.FC<EnhancedSearchResultsProps> = ({
  searchQuery,
  resultCount,
  isSearching,
  searchTime
}) => {
  if (!searchQuery && !isSearching) {
    return null;
  }

  return (
    <Card className="mb-4 bg-muted/30">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isSearching ? 'Поиск...' : 'Результаты поиска'}
              </span>
            </div>
            
            {searchQuery && (
              <Badge variant="outline" className="text-xs">
                "{searchQuery}"
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {!isSearching && (
              <>
                <span className="font-medium text-foreground">
                  {resultCount} {resultCount === 1 ? 'товар' : resultCount < 5 ? 'товара' : 'товаров'}
                </span>
                {searchTime && (
                  <span>
                    за {searchTime}мс
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Search insights */}
        {!isSearching && resultCount > 0 && (
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Результаты отсортированы по релевантности</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Мгновенный поиск</span>
            </div>
          </div>
        )}
        
        {/* No results message */}
        {!isSearching && resultCount === 0 && searchQuery && (
          <div className="mt-2 text-sm text-muted-foreground">
            По запросу <span className="font-medium text-foreground">"{searchQuery}"</span> ничего не найдено.
            <br />
            <span className="text-xs">Попробуйте изменить поисковый запрос или воспользоваться фильтрами выше.</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnhancedSearchResults;