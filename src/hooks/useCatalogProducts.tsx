import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useAISearch } from '@/hooks/useAISearch';
import { useAllCarBrands } from '@/hooks/useAllCarBrands';
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
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Get car brands and models data
  const {
    brands,
    brandModels,
    allModels,
    isLoading: isLoadingCarData,
    findBrandNameById,
    findModelNameById,
    findBrandIdByName,
    findModelIdByName
  } = useAllCarBrands();

  // Debounce search and AI search (increased debounce for better performance)
  const debouncedSearchTerm = useDebounceSearch(activeSearchTerm, 800);
  const { performAISearch, isSearching: isAISearching, searchType } = useAISearch();

  // Get AI results when search term changes
  const aiResults = useMemo(() => {
    return null; // Will be populated by the query function
  }, [debouncedSearchTerm]);

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
      selectedBrand,
      selectedModel,
      sortBy
    }],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const timer = performance.mark('catalog-query-start');
        console.log('[Catalog] Starting query for page:', pageParam, {
          debouncedSearchTerm,
          activeSearchTerm,
          hideSoldProducts,
          selectedBrand,
          selectedModel,
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

        // Apply brand/model filters (standard SQL filtering for exact matches)
        if (selectedBrand) {
          const brandName = findBrandNameById(selectedBrand);
          if (brandName) {
            query = query.eq('brand', brandName);
          }
        }

        if (selectedModel) {
          const modelName = findModelNameById(selectedModel);
          if (modelName) {
            query = query.eq('model', modelName);
          }
        }

        // Hide sold products filter
        if (hideSoldProducts) {
          query = query.neq('status', 'sold');
        }

        // Implement new search priority logic
        let searchStrategy = 'none';
        let isAISearch = false;
        let productIds: string[] = [];

        const hasSearchTerm = debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2;
        const hasBrandFilter = selectedBrand;
        const hasModelFilter = selectedModel;

        if (hasSearchTerm && (hasBrandFilter || hasModelFilter)) {
          // HYBRID SEARCH: AI search + brand/model filtering
          searchStrategy = 'hybrid';
          console.log('🔄 Using HYBRID search strategy (AI + brand/model filters)');
          
          try {
            const aiSearchResult = await performAISearch(debouncedSearchTerm.trim(), {
              similarityThreshold: 0.12,
              matchCount: 200,
              enableFallback: true
            });
            
            if (aiSearchResult.success && aiSearchResult.results.length > 0) {
              productIds = aiSearchResult.results.map(r => r.id);
              isAISearch = true;
              console.log('🎯 Hybrid AI search found products:', productIds.length);
              
              // Apply AI results filter first
              query = query.in('id', productIds);
              (query as any)._aiOrder = productIds;
              (query as any)._searchType = aiSearchResult.searchType || 'ai';
            } else {
              console.log('❌ AI search failed in hybrid mode, falling back to text + filters');
              // Fallback: text search
              query = query.ilike('title', `%${debouncedSearchTerm.trim()}%`);
              (query as any)._searchType = 'fallback';
            }
          } catch (error) {
            console.error('❌ Hybrid search error, falling back to text + filters:', error);
            query = query.ilike('title', `%${debouncedSearchTerm.trim()}%`);
            (query as any)._searchType = 'fallback';
          }
        } else if (hasSearchTerm) {
          // PURE AI SEARCH: Only search term, no brand/model
          searchStrategy = 'ai';
          console.log('🧠 Using PURE AI search strategy');
          
          try {
            const aiSearchResult = await performAISearch(debouncedSearchTerm.trim(), {
              similarityThreshold: 0.15,
              matchCount: 100,
              enableFallback: true
            });
            
            if (aiSearchResult.success && aiSearchResult.results.length > 0) {
              productIds = aiSearchResult.results.map(r => r.id);
              isAISearch = true;
              console.log('🎯 Pure AI search found products:', productIds.length);
              
              query = query.in('id', productIds);
              (query as any)._aiOrder = productIds;
              (query as any)._searchType = aiSearchResult.searchType || 'ai';
            } else {
              console.log('❌ AI search failed, falling back to text search');
              query = query.ilike('title', `%${debouncedSearchTerm.trim()}%`);
              (query as any)._searchType = 'fallback';
            }
          } catch (error) {
            console.error('❌ Pure AI search error, falling back to text search:', error);
            query = query.ilike('title', `%${debouncedSearchTerm.trim()}%`);
            (query as any)._searchType = 'fallback';
          }
        } else if (hasBrandFilter || hasModelFilter) {
          // STANDARD FILTERING: Only brand/model, no search term
          searchStrategy = 'filter';
          console.log('🔧 Using STANDARD filtering strategy (brand/model only)');
          (query as any)._searchType = 'filter';
        } else {
          // SHOW ALL: No filters or search terms
          searchStrategy = 'all';
          console.log('📋 Showing ALL products (no filters)');
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

  const handleBrandChange = useCallback((brandId: string, brandName: string) => {
    setSelectedBrand(brandId);
    setSelectedModel(''); // Reset model when brand changes
  }, []);

  const handleModelChange = useCallback((modelId: string, modelName: string) => {
    setSelectedModel(modelId);
  }, []);

  const handleClearBrandModel = useCallback(() => {
    setSelectedBrand('');
    setSelectedModel('');
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
    selectedBrand,
    selectedModel,
    brands,
    brandModels,
    allProducts: mappedProducts,
    mappedProducts,
    productChunks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoading || isLoadingCarData,
    isError,
    error,
    refetch,
    handleClearSearch,
    handleSearch,
    handleSearchSubmit,
    handleBrandChange,
    handleModelChange,
    handleClearBrandModel,
    prefetchNextPage,
    isActiveFilters: !!(activeSearchTerm || hideSoldProducts || selectedBrand || selectedModel),
    isAISearching,
    searchType,
    findBrandNameById,
    findModelNameById
  };
};

export default useCatalogProducts;