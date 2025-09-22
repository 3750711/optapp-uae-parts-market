import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchFilters {
  brand?: string;
  location?: string;
  price_min?: number;
  price_max?: number;
  status?: string;
}

interface SearchResult {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  location: string;
  preview_image_url: string;
  similarity: number;
  seller_name: string;
  status: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  threshold: number;
  processing_time: number;
}

export const useSemanticSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [totalResults, setTotalResults] = useState(0);
  const { toast } = useToast();

  const search = useCallback(async (
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      filters?: SearchFilters;
    } = {}
  ) => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsSearching(true);
    setLastQuery(query);

    try {
      console.log('🔍 Starting semantic search:', query);

      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: {
          query: query.trim(),
          limit: options.limit || 20,
          threshold: options.threshold || 0.7,
          filters: options.filters || {},
        },
      });

      if (error) {
        console.error('Semantic search error:', error);
        throw new Error(error.message || 'Search failed');
      }

      const response: SearchResponse = data;
      
      console.log(`✅ Semantic search completed: ${response.results.length} results`);
      
      setResults(response.results);
      setTotalResults(response.total);

      // Show success message for good results
      if (response.results.length > 0) {
        toast({
          title: "Поиск завершен",
          description: `Найдено ${response.results.length} релевантных товаров`,
        });
      } else {
        toast({
          title: "Товары не найдены",
          description: "Попробуйте изменить запрос или уменьшить точность поиска",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Semantic search failed:', error);
      toast({
        title: "Ошибка поиска",
        description: error instanceof Error ? error.message : "Произошла ошибка при поиске",
        variant: "destructive",
      });
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setLastQuery('');
    setIsSearching(false);
  }, []);

  return {
    search,
    reset,
    isSearching,
    results,
    lastQuery,
    totalResults,
    hasResults: results.length > 0,
  };
};