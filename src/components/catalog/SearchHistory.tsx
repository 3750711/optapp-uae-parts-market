
import React from 'react';
import { Clock, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchHistoryItem } from '@/hooks/useSearchHistory';

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelectHistoryItem: (item: SearchHistoryItem) => void;
  onRemoveItem: (index: number) => void;
  onClearHistory: () => void;
  isVisible: boolean;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelectHistoryItem,
  onRemoveItem,
  onClearHistory,
  isVisible
}) => {
  if (!isVisible || history.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>История поиска</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Очистить
          </Button>
        </div>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {history.map((item, index) => (
          <div
            key={index}
            className="group flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
            onClick={() => onSelectHistoryItem(item)}
          >
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {item.query}
                </span>
                {(item.brand || item.model) && (
                  <div className="flex gap-1 mt-1">
                    {item.brand && (
                      <Badge variant="secondary" className="text-xs">
                        {item.brand}
                      </Badge>
                    )}
                    {item.model && (
                      <Badge variant="secondary" className="text-xs">
                        {item.model}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveItem(index);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchHistory;
