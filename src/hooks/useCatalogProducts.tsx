import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useAISearch } from '@/hooks/useAISearch';

import type { ProductProps } from '@/components/product/ProductCard';

// ProductType definition
export type ProductType = {
  id: string;
  title: string;
  price: number | string;
  product_images?: { url: string; is_primary?: boolean }[];
  profiles?: { 
    full_name?: string;
    opt_id?: string; 
    rating?: number; 
  };
  condition?: string;
  brand?: string;
  model?: string;
  seller_name: string;
  status: string;
  seller_id: string;
  delivery_price?: number | null;
  optid_created?: string | null;
  cloudinary_public_id?: string | null;
  cloudinary_url?: string | null;
  rating_seller?: number | null;
  lot_number?: number | null;
  created_at: string;
};

export interface CatalogFilters {
  activeSearchTerm: string;
  hideSoldProducts: boolean;
  activeBrand?: string | null;
  activeModel?: string | null;
}

interface UseCatalogProductsProps {
  productsPerPage?: number;
  sortBy?: string;
  findBrandNameById?: (brandId: string | null) => string | null;
  findModelNameById?: (modelId: string | null) => string | null;
}

export const useCatalogProducts = ({ 
  productsPerPage = 24,
  sortBy = 'newest'
}: UseCatalogProductsProps = {}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [hideSoldProducts, setHideSoldProducts] = useState(false);

  // Debounce search and AI search (increased debounce for better performance)
  const debouncedSearchTerm = useDebounceSearch(activeSearchTerm, 800);
  const { performAISearch, isSearching: isAISearching, searchType } = useAISearch();
  
  // Store AI similarity scores for product highlighting
  const [aiSimilarityScores, setAiSimilarityScores] = useState<{ [productId: string]: number }>({});

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['products-infinite', {
      debouncedSearchTerm,
      hideSoldProducts,
      sortBy
    }],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const timer = performance.mark('catalog-query-start');
        console.log('[Catalog] Starting query for page:', pageParam, {
          debouncedSearchTerm,
          activeSearchTerm,
          hideSoldProducts,
          productsPerPage
        });

        let query = supabase
          .from('products')
          .select(`
            id,
            title,
            price,
            brand,
            model,
            condition,
            status,
            seller_id,
            delivery_price,
            optid_created,
            cloudinary_public_id,
            cloudinary_url,
            lot_number,
            created_at,
            profiles!products_seller_id_fkey (
              full_name,
              opt_id,
              rating
            ),
            product_images (
              url,
              is_primary
            )
          `);

        // Hide sold products filter
        if (hideSoldProducts) {
          query = query.neq('status', 'sold');
        }

        // Simplified AI-only search logic
        const hasSearchTerm = debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2;

        if (hasSearchTerm) {
          // AI SEARCH: Use AI for all searches with exact match prioritization
          console.log('🧠 Using AI search with exact match prioritization');
          
          try {
            const aiSearchResult = await performAISearch(debouncedSearchTerm.trim(), {
              similarityThreshold: 0.1, // Lower threshold for better coverage
              matchCount: 500, // Higher count for better results
              enableFallback: true
            });
            
            if (aiSearchResult.success && aiSearchResult.results.length > 0) {
              const productIds = aiSearchResult.results.map(r => r.id);
              console.log('🎯 AI search found products:', productIds.length);
              
              // Store similarity scores for highlighting
              if (aiSearchResult.similarityScores) {
                setAiSimilarityScores(aiSearchResult.similarityScores);
              }
              
              query = query.in('id', productIds);
              (query as any)._aiOrder = productIds;
              (query as any)._searchType = aiSearchResult.searchType || 'ai';
            } else {
              console.log('❌ AI search failed, falling back to enhanced text search');
              // Enhanced fallback with multiple search strategies
              const searchWords = debouncedSearchTerm.trim().split(/\s+/);
              if (searchWords.length === 1) {
                // Single word: exact match first, then partial
                query = query.or(`title.ilike.%${debouncedSearchTerm.trim()}%,brand.ilike.%${debouncedSearchTerm.trim()}%,model.ilike.%${debouncedSearchTerm.trim()}%`);
              } else {
                // Multiple words: try full phrase first, then individual words
                const fullPhrase = debouncedSearchTerm.trim();
                const wordFilters = searchWords.map(word => 
                  `title.ilike.%${word}%,brand.ilike.%${word}%,model.ilike.%${word}%`
                ).join(',');
                query = query.or(`title.ilike.%${fullPhrase}%,${wordFilters}`);
              }
              (query as any)._searchType = 'fallback';
            }
          } catch (error) {
            console.error('❌ AI search error, falling back to text search:', error);
            query = query.ilike('title', `%${debouncedSearchTerm.trim()}%`);
            (query as any)._searchType = 'fallback';
          }
        } else {
          // SHOW ALL: No search terms
          console.log('📋 Showing ALL products (no search)');
          (query as any)._searchType = 'all';
        }

        // Sorting
        switch (sortBy) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        // Pagination
        const from = pageParam * productsPerPage;
        const to = from + productsPerPage - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        
        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }
        
        let products = data || [];
        
        // Sort by AI relevance order if available
        if ((query as any)._aiOrder) {
          const aiOrder = (query as any)._aiOrder;
          products = products.sort((a, b) => {
            const indexA = aiOrder.indexOf(a.id);
            const indexB = aiOrder.indexOf(b.id);
            return indexA - indexB;
          });
        }
        
        const dataWithSortedImages = products.map(product => ({
          ...product,
          product_images: product.product_images?.sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return 0;
          })
        }));
        
        return dataWithSortedImages;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error('Unknown error occurred while loading products');
        }
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  // Add prefetching for next page
  const prefetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Ошибка загрузки товаров",
        description: error instanceof Error ? error.message : "Не удалось загрузить товары",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const allProducts = data?.pages.flat() || [];
  
  const mappedProducts: ProductProps[] = useMemo(() => {
    try {
      const mapped = allProducts.map((product) => {
        const typedProduct = product as unknown as ProductType;
        
        return {
          id: typedProduct.id,
          title: typedProduct.title,
          price: Number(typedProduct.price),
          brand: typedProduct.brand || "",
          model: typedProduct.model || "",
          condition: typedProduct.condition || "Новое",
          seller_name: typedProduct.seller_name,
          status: typedProduct.status,
          seller_id: typedProduct.seller_id,
          delivery_price: typedProduct.delivery_price,
          optid_created: typedProduct.optid_created,
          cloudinary_public_id: typedProduct.cloudinary_public_id,
          cloudinary_url: typedProduct.cloudinary_url,
          rating_seller: typedProduct.rating_seller,
          lot_number: typedProduct.lot_number,
          similarity_score: aiSimilarityScores[typedProduct.id] || undefined, // Add similarity score
          product_images: typedProduct.product_images?.map(img => ({
            id: '',
            url: img.url,
            is_primary: img.is_primary || false
          }))
        } as ProductProps;
      });
      
      return mapped;
    } catch (mappingError) {
      // Return empty array on mapping error - UI will handle empty state
      return [];
    }
  }, [allProducts]);

  // Optimized product chunks synchronized with page size
  const productChunks = useMemo(() => {
    const chunkSize = 24; // Synchronized with productsPerPage for consistent loading
    const chunks = [];
    
    for (let i = 0; i < mappedProducts.length; i += chunkSize) {
      chunks.push(mappedProducts.slice(i, i + chunkSize));
    }
    
    return chunks;
  }, [mappedProducts, aiSimilarityScores]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setAiSimilarityScores({}); // Clear similarity scores when clearing search
  }, []);


  const handleSearch = useCallback(() => {
    setActiveSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  }, [handleSearch]);

  return {
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    hideSoldProducts,
    setHideSoldProducts,
    allProducts: mappedProducts,
    mappedProducts,
    productChunks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoading,
    isError,
    error,
    refetch,
    handleClearSearch,
    handleSearch,
    handleSearchSubmit,
    prefetchNextPage,
    isActiveFilters: !!(activeSearchTerm || hideSoldProducts),
    isAISearching,
    searchType
  };
};

export default useCatalogProducts;