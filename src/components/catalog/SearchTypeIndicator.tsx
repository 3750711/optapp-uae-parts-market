import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Hash, User, Search } from 'lucide-react';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';

interface SearchTypeIndicatorProps {
  searchTerm: string;
}

const SearchTypeIndicator: React.FC<SearchTypeIndicatorProps> = ({ searchTerm }) => {
  const { searchConditions, hasActiveSearch } = useUnifiedSearch(searchTerm);

  if (!hasActiveSearch || !searchTerm.trim()) {
    return null;
  }

  if (searchConditions.lotNumber) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Hash className="h-3 w-3 mr-1" />
        Поиск по лоту: {searchConditions.lotNumber}
      </Badge>
    );
  }

  if (searchConditions.optIdSearch) {
    return (
      <Badge variant="secondary" className="text-xs">
        <User className="h-3 w-3 mr-1" />
        Поиск по OPT-ID: {searchConditions.optIdSearch}
      </Badge>
    );
  }

  if (searchConditions.textSearch) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Search className="h-3 w-3 mr-1" />
        Поиск в тексте: {searchConditions.textSearch}
      </Badge>
    );
  }

  return null;
};

export default SearchTypeIndicator;