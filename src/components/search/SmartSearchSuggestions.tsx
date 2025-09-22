import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchSuggestion {
  query: string;
  category: 'popular' | 'recent' | 'recommended';
  count?: number;
}

export const SmartSearchSuggestions: React.FC<{
  onSuggestionClick: (query: string) => void;
}> = ({ onSuggestionClick }) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch popular queries from analytics
      const { data: analyticsData } = await supabase
        .from('search_analytics')
        .select('query, results_count')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .gt('results_count', 0)
        .order('created_at', { ascending: false })
        .limit(20);

      if (analyticsData) {
        // Group by query and count
        const queryCount: Record<string, number> = {};
        analyticsData.forEach(item => {
          queryCount[item.query] = (queryCount[item.query] || 0) + 1;
        });

        // Get popular queries
        const popularQueries = Object.entries(queryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([query, count]) => ({
            query,
            category: 'popular' as const,
            count
          }));

        // Get recent unique queries
        const recentQueries = analyticsData
          .filter((item, index, self) => 
            self.findIndex(other => other.query === item.query) === index
          )
          .slice(0, 3)
          .map(item => ({
            query: item.query,
            category: 'recent' as const
          }));

        // Predefined recommended queries
        const recommendedQueries: SearchSuggestion[] = [
          { query: 'фара BMW X5', category: 'recommended' },
          { query: 'двигатель Mercedes C класс', category: 'recommended' },
          { query: 'тормозные колодки Toyota Camry', category: 'recommended' },
          { query: 'коробка передач Audi A4', category: 'recommended' },
        ];

        setSuggestions([
          ...popularQueries,
          ...recentQueries,
          ...recommendedQueries.slice(0, 2) // Add some recommended
        ]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to recommended queries
      setSuggestions([
        { query: 'фара BMW X5', category: 'recommended' },
        { query: 'двигатель Mercedes C класс', category: 'recommended' },
        { query: 'тормозные колодки Toyota Camry', category: 'recommended' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: SearchSuggestion['category']) => {
    switch (category) {
      case 'popular':
        return <TrendingUp className="h-3 w-3" />;
      case 'recent':
        return <Clock className="h-3 w-3" />;
      case 'recommended':
        return <Brain className="h-3 w-3" />;
      default:
        return <Zap className="h-3 w-3" />;
    }
  };

  const getCategoryLabel = (category: SearchSuggestion['category']) => {
    switch (category) {
      case 'popular': return 'Популярно';
      case 'recent': return 'Недавно';
      case 'recommended': return 'Рекомендуем';
      default: return '';
    }
  };

  const getCategoryColor = (category: SearchSuggestion['category']) => {
    switch (category) {
      case 'popular': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'recent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'recommended': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Умные предложения
        </h3>
        
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={`${suggestion.query}-${index}`}
              variant="ghost"
              onClick={() => onSuggestionClick(suggestion.query)}
              className="w-full justify-start h-auto p-2 text-left"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getCategoryColor(suggestion.category)}`}
                  >
                    {getCategoryIcon(suggestion.category)}
                    <span className="ml-1">{getCategoryLabel(suggestion.category)}</span>
                  </Badge>
                  <span className="text-sm">{suggestion.query}</span>
                </div>
                {suggestion.count && (
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.count}x
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};