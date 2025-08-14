import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AISearchResult {
  product_id: string;
  similarity: number;
  exact_match_score?: number;
  hybrid_score?: number;
}

interface AISearchResponse {
  success: boolean;
  query: string;
  results: AISearchResult[];
  count: number;
  error?: string;
}

export const useAISearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const performAISearch = useCallback(async (
    query: string,
    options: {
      similarityThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<AISearchResponse> => {
    if (!query.trim()) {
      return {
        success: false,
        query,
        results: [],
        count: 0,
        error: 'Query cannot be empty'
      };
    }

    setIsSearching(true);
    setLastQuery(query);

    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: {
          query: query.trim(),
          similarityThreshold: options.similarityThreshold || 0.2,
          matchCount: options.matchCount || 50
        }
      });

      if (error) {
        console.error('AI search error:', error);
        return {
          success: false,
          query,
          results: [],
          count: 0,
          error: error.message
        };
      }

      return data as AISearchResponse;

    } catch (error) {
      console.error('AI search failed:', error);
      return {
        success: false,
        query,
        results: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    } finally {
      setIsSearching(false);
    }
  }, []);

  const generateEmbeddings = useCallback(async (productIds?: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          productIds,
          batchSize: 50
        }
      });

      if (error) {
        console.error('Embedding generation error:', error);
        return { success: false, error: error.message };
      }

      return data;

    } catch (error) {
      console.error('Embedding generation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Generation failed' 
      };
    }
  }, []);

  return {
    performAISearch,
    generateEmbeddings,
    isSearching,
    lastQuery
  };
};