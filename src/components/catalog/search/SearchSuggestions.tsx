import React from 'react';
import { Clock, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SearchSuggestionsProps {
  currentQuery: string;
  onSuggestionSelect: (suggestion: string) => void;
  popularSearches: string[];
  recentSearches: string[];
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  currentQuery,
  onSuggestionSelect,
  popularSearches,
  recentSearches
}) => {
  // Auto-complete suggestions based on current query
  const autoCompleteSuggestions = React.useMemo(() => {
    if (!currentQuery.trim()) return [];
    
    const allSuggestions = [
      ...popularSearches,
      ...recentSearches,
      // Common auto part search patterns
      'фары', 'бампер', 'двигатель', 'коробка передач', 'стартер', 
      'генератор', 'радиатор', 'тормозные диски', 'амортизаторы',
      'nissan', 'toyota', 'mazda', 'honda', 'mitsubishi', 'subaru'
    ];
    
    return allSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(currentQuery.toLowerCase()) &&
        suggestion.toLowerCase() !== currentQuery.toLowerCase()
      )
      .slice(0, 5);
  }, [currentQuery, popularSearches, recentSearches]);

  // Show different content based on whether user is typing
  const showAutoComplete = currentQuery.trim().length > 0;

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
      <div className="p-3">
        {showAutoComplete ? (
          // Auto-complete suggestions while typing
          <div>
            {autoCompleteSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Предложения</span>
                </div>
                <div className="space-y-1">
                  {autoCompleteSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 hover:bg-muted"
                      onClick={() => onSuggestionSelect(suggestion)}
                    >
                      <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="text-sm">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show recent and popular searches when not typing
          <div className="space-y-4">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Недавние поиски</span>
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 hover:bg-muted"
                      onClick={() => onSuggestionSelect(search)}
                    >
                      <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {recentSearches.length > 0 && popularSearches.length > 0 && (
              <Separator />
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Популярные поиски</span>
                </div>
                <div className="space-y-1">
                  {popularSearches.slice(0, 5).map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 hover:bg-muted"
                      onClick={() => onSuggestionSelect(search)}
                    >
                      <TrendingUp className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Default suggestions if nothing else available */}
            {recentSearches.length === 0 && popularSearches.length === 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Попробуйте поискать</span>
                </div>
                <div className="space-y-1">
                  {['фары', 'бампер', 'двигатель', 'nissan', 'toyota'].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 hover:bg-muted"
                      onClick={() => onSuggestionSelect(suggestion)}
                    >
                      <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="text-sm">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SearchSuggestions;