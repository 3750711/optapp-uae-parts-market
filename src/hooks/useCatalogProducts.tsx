import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProductProps } from '@/components/product/ProductCard';
import { SortOption } from '@/components/catalog/ProductSorting';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useUnifiedSearch } from './useUnifiedSearch';
import { useAISearch } from './useAISearch';

export type ProductType = {
  id: string;
  title: string;
  price: number | string;
  product_images?: { url: string; is_primary?: boolean }[];
  profiles?: { location?: string; opt_id?: string; rating?: number; opt_status?: string; verification_status?: string };
  condition?: string;
  location?: string;
  optid_created?: string | null;
  rating_seller?: number | null;
  brand?: string;
  model?: string;
  seller_name: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  seller_id: string;
  created_at: string;
  delivery_price?: number | null;
  cloudinary_public_id?: string | null;
  cloudinary_url?: string | null;
  lot_number?: number | null;
};

export interface CatalogFilters {
  activeSearchTerm: string;
  hideSoldProducts: boolean;
  activeBrand?: string | null;
  activeModel?: string | null;
}

interface UseCatalogProductsProps {
  productsPerPage?: number;
  sortBy?: SortOption;
  externalSelectedBrand?: string | null;
  externalSelectedModel?: string | null;
  findBrandNameById?: (brandId: string | null) => string | null;
  findModelNameById?: (modelId: string | null) => string | null;
  debounceTime?: number;
}

export const useCatalogProducts = ({ 
  productsPerPage = 24, // Increased from 8 to 24 for better pagination
  sortBy = 'newest',
  externalSelectedBrand = null,
  externalSelectedModel = null,
  findBrandNameById,
  findModelNameById,
  debounceTime = 200
}: UseCatalogProductsProps = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [hideSoldProducts, setHideSoldProducts] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAdminAccess();
  const { startTimer } = usePerformanceMonitor();
  const isInitialRender = useRef(true);
  
  // Simplified - no brand/model selection needed

  // Use unified search for intelligent search parsing
  const {
    searchTerm: unifiedSearchTerm,
    searchConditions,
    hasActiveSearch,
    shouldUseAISearch
  } = useUnifiedSearch(activeSearchTerm);

  const { performAISearch, isSearching: isAISearching } = useAISearch();


  const buildSortQuery = (query: any, sortOption: SortOption) => {
    switch (sortOption) {
      case 'newest':
        return query.order('created_at', { ascending: false });
      case 'oldest':
        return query.order('created_at', { ascending: true });
      case 'price_asc':
        return query.order('price', { ascending: true });
      case 'price_desc':
        return query.order('price', { ascending: false });
      case 'name_asc':
        return query.order('title', { ascending: true });
      case 'name_desc':
        return query.order('title', { ascending: false });
      default:
        return query.order('created_at', { ascending: false });
    }
  };

  const filters = useMemo(() => {
    const filtersObj = {
      activeSearchTerm,
      hideSoldProducts,
      sortBy,
      isAdmin,
      searchConditions,
      shouldUseAISearch: true // Always use AI search
    };
    return filtersObj;
  }, [activeSearchTerm, hideSoldProducts, sortBy, isAdmin, searchConditions]);

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
    queryKey: ['products-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const timer = startTimer(`products-query-page-${pageParam}`);
      try {
        const from = pageParam * productsPerPage;
        const to = from + productsPerPage - 1;
        
        // Optimized query with composite indexes for search performance
        let query = supabase
          .from('products')
          .select(`
            id, 
            title, 
            price, 
            condition,
            brand, 
            model,
            seller_name,
            seller_id,
            status,
            created_at,
            rating_seller,
            delivery_price,
            optid_created,
            cloudinary_public_id, 
            cloudinary_url,
            lot_number,
            product_images(url, is_primary)
          `);

        // Limit images per product for performance
        query.limit(2, { foreignTable: 'product_images' });

        query = buildSortQuery(query, sortBy);

        // Apply status filters with optimized index usage
        if (filters.hideSoldProducts) {
          query = query.eq('status', 'active');
        } else {
          if (filters.isAdmin) {
            query = query.in('status', ['active', 'sold', 'pending', 'archived']);
          } else {
            query = query.in('status', ['active', 'sold']);
          }
        }

        // Hybrid search: AI search for natural language queries, traditional for exact matches
        if (filters.activeSearchTerm && filters.activeSearchTerm.trim()) {
          const { searchConditions } = filters;
          
          if (searchConditions.lotNumber) {
            // Search by lot number
            query = query.eq('lot_number', searchConditions.lotNumber);
          } else if (searchConditions.optIdSearch) {
            // Search by seller OPT-ID
            query = query.ilike('optid_created', `%${searchConditions.optIdSearch}%`);
          } else if (searchConditions.textSearch) {
            // Use pure AI semantic search for all text queries
            if (shouldUseAISearch) {
              try {
                console.log('🔍 Performing AI semantic search for:', searchConditions.textSearch);
                const aiSearchResult = await performAISearch(searchConditions.textSearch, {
                  similarityThreshold: 0.3, // Cosine distance threshold for similarity > 0.7
                  matchCount: 100 // Increased for better search coverage
                });
                
                if (aiSearchResult.success && aiSearchResult.results.length > 0) {
                  const productIds = aiSearchResult.results.map(r => r.product_id);
                  console.log('🎯 AI semantic search found products in relevance order:', productIds);
                  
                  // Only get products found by AI search - no fallback
                  query = query.in('id', productIds);
                  
                  // Store the AI order for frontend sorting to preserve semantic relevance
                  (query as any)._aiOrder = productIds;
                } else {
                  console.log('❌ AI search returned no results');
                  // Return empty results for pure AI search - no fallback
                  query = query.in('id', []);
                }
              } catch (error) {
                console.error('❌ AI search failed:', error);
                // Return empty results for pure AI search - no fallback
                query = query.in('id', []);
              }
            } else {
              // For queries too short for AI search (< 3 chars), use basic text search
              console.log('⚡ Using basic text search for short query');
              query = query.ilike('title', `%${searchConditions.textSearch}%`);
            }
          }
        }

        // Brand/model filtering removed - AI search handles all filtering

        query = query.range(from, to);

        const { data, error } = await query;
        
        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }
        
        let products = data || [];
        
        // Sort by AI semantic relevance order if available
        if ((query as any)._aiOrder && shouldUseAISearch) {
          const aiOrder = (query as any)._aiOrder;
          console.log('🔄 Sorting products by AI semantic relevance order');
          products = products.sort((a, b) => {
            const indexA = aiOrder.indexOf(a.id);
            const indexB = aiOrder.indexOf(b.id);
            return indexA - indexB;
          });
          console.log('✅ Products sorted by AI semantic relevance:', products.slice(0, 5).map(p => p.id));
        }
        
        const dataWithSortedImages = products.map(product => ({
          ...product,
          product_images: product.product_images?.sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return 0;
          })
        }));
        
        timer.end();
        return dataWithSortedImages;
      } catch (error) {
        timer.end();
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
  }, [mappedProducts]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
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
    isLoading,
    isError,
    error,
    refetch,
    handleClearSearch,
    handleSearch,
    handleSearchSubmit,
    prefetchNextPage,
    isActiveFilters: !!(activeSearchTerm || hideSoldProducts),
    isAISearching,
    shouldUseAISearch: true // Always true for simplified search
  };
};

export default useCatalogProducts;
