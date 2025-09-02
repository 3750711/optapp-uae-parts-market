import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AISearchResult {
  id: string;
  title?: string;
  brand?: string;
  model?: string;
  similarity: number;
  similarity_score?: number; // Add similarity_score for consistency
}

export interface AISearchResponse {
  success: boolean;
  query: string;
  results: AISearchResult[];
  count: number;
  totalCount?: number;
  hasNextPage?: boolean;
  currentPage?: number;
  totalPages?: number;
  error?: string;
  searchType?: 'ai' | 'fallback';
  cached?: boolean;
  similarityScores?: { [productId: string]: number }; // Add similarity scores map
}

interface CacheEntry {
  data: AISearchResponse;
  timestamp: number;
}

export const useAISearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [searchType, setSearchType] = useState<'ai' | 'fallback' | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  
  // Cache duration: 10 minutes
  const CACHE_DURATION = 10 * 60 * 1000;

  const performAISearch = useCallback(async (
    query: string,
    options: {
      similarityThreshold?: number;
      matchCount?: number;
      offset?: number;
      limit?: number;
      enableFallback?: boolean;
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

    // Check cache first (include pagination in cache key)
    const cacheKey = `${query.trim().toLowerCase()}_${options.similarityThreshold || 0.6}_${options.matchCount || 1000}_${options.offset || 0}_${options.limit || 20}`;
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Returning cached AI search result for:', query);
      setSearchType('ai');
      return { ...cached.data, cached: true };
    }

    setIsSearching(true);
    setLastQuery(query);
    setSearchType('ai');

    try {
      // Защита: проверяем авторизацию перед вызовом Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('AI search requires authentication');
        return { 
          success: false,
          query,
          results: [], 
          count: 0,
          error: 'Authentication required for AI search',
          cached: false 
        };
      }

      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: {
          query: query.trim(),
          similarityThreshold: options.similarityThreshold || 0.6,
          matchCount: options.matchCount || 1000,
          offset: options.offset || 0,
          limit: options.limit || 20
        }
      });

      if (error) {
        console.error('AI search error:', error);
        
        // Try fallback to standard search if enabled
        if (options.enableFallback) {
          console.log('Falling back to standard search...');
          setSearchType('fallback');
          return {
            success: true,
            query,
            results: [],
            count: 0,
            searchType: 'fallback',
            error: `AI search failed, using standard search: ${error.message}`
          };
        }
        
        return {
          success: false,
          query,
          results: [],
          count: 0,
          error: error.message
        };
      }

      const response = { ...data as AISearchResponse, searchType: 'ai' as const };
      
      // Create similarity scores map for easy access
      if (response.success && response.results) {
        response.similarityScores = response.results.reduce((acc, result) => {
          acc[result.id] = result.similarity || result.similarity_score || 0;
          return acc;
        }, {} as { [productId: string]: number });
      }
      
      // Cache successful results
      if (response.success) {
        cacheRef.current.set(cacheKey, {
          data: response,
          timestamp: now
        });
        
        // Clean old cache entries
        for (const [key, entry] of cacheRef.current.entries()) {
          if ((now - entry.timestamp) > CACHE_DURATION) {
            cacheRef.current.delete(key);
          }
        }
      }

      return response;

    } catch (error) {
      console.error('AI search failed:', error);
      
      // Try fallback to standard search if enabled
      if (options.enableFallback) {
        console.log('Falling back to standard search after exception...');
        setSearchType('fallback');
        return {
          success: true,
          query,
          results: [],
          count: 0,
          searchType: 'fallback',
          error: `AI search failed, using standard search: ${error instanceof Error ? error.message : 'Search failed'}`
        };
      }
      
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

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    console.log('AI search cache cleared');
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
    lastQuery,
    searchType,
    clearCache
  };
};