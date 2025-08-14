import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AISearchResult {
  id: string;
  title?: string;
  brand?: string;
  model?: string;
  similarity: number;
  exact_match_score?: number;
  hybrid_score?: number;
}

export interface AISearchResponse {
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

  const generateEmbeddingForProduct = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          productIds: [productId],
          batchSize: 1
        }
      });

      if (error) {
        console.error('Single product embedding generation error:', error);
        return { success: false, error: error.message };
      }

      return data;

    } catch (error) {
      console.error('Single product embedding generation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Generation failed' 
      };
    }
  }, []);

  const regenerateMissingEmbeddings = useCallback(async () => {
    try {
      console.log('Regenerating missing embeddings...');
      
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          batchSize: 10,
          statuses: ['active', 'sold']
        }
      });

      if (error) {
        console.error('Error regenerating embeddings:', error);
        return { success: false, error: error.message };
      }

      console.log('Missing embeddings regeneration result:', data);
      return data;
    } catch (error) {
      console.error('Error in regenerateMissingEmbeddings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Regeneration failed' 
      };
    }
  }, []);

  return {
    performAISearch,
    generateEmbeddings,
    generateEmbeddingForProduct,
    regenerateMissingEmbeddings,
    isSearching,
    lastQuery
  };
};