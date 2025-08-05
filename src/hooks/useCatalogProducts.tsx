import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProductProps } from '@/components/product/ProductCard';
import { SortOption } from '@/components/catalog/ProductSorting';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useUnifiedSearch } from './useUnifiedSearch';

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
  
  // Separate selected (UI) and active (filtering) states for brand/model
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  const selectedBrandName = findBrandNameById ? findBrandNameById(selectedBrand) : selectedBrand;
  const selectedModelName = findModelNameById ? findModelNameById(selectedModel) : selectedModel;
  const activeBrandName = findBrandNameById ? findBrandNameById(activeBrand) : activeBrand;
  const activeModelName = findModelNameById ? findModelNameById(activeModel) : activeModel;

  // Use unified search for intelligent search parsing
  const { searchConditions, hasActiveSearch } = useUnifiedSearch(activeSearchTerm);


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
      activeBrandName,
      activeModelName,
      sortBy,
      isAdmin,
      searchConditions
    };
    return filtersObj;
  }, [activeSearchTerm, hideSoldProducts, activeBrandName, activeModelName, sortBy, isAdmin, searchConditions]);

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

        // Intelligent search using unified search conditions
        if (filters.activeSearchTerm && filters.activeSearchTerm.trim()) {
          const { searchConditions } = filters;
          
          if (searchConditions.lotNumber) {
            // Search by lot number
            query = query.eq('lot_number', searchConditions.lotNumber);
          } else if (searchConditions.optIdSearch) {
            // Search by seller OPT-ID
            query = query.ilike('optid_created', `%${searchConditions.optIdSearch}%`);
          } else if (searchConditions.textSearch) {
            // Dynamic text search - exclude fields that are being filtered separately
            const searchTerm = searchConditions.textSearch;
            const searchFields = [];
            
            // Always include title and seller_name
            searchFields.push(`title.ilike.%${searchTerm}%`);
            searchFields.push(`seller_name.ilike.%${searchTerm}%`);
            
            // Only include brand in search if not being filtered separately
            if (!filters.activeBrandName) {
              searchFields.push(`brand.ilike.%${searchTerm}%`);
            }
            
            // Only include model in search if not being filtered separately
            if (!filters.activeModelName) {
              searchFields.push(`model.ilike.%${searchTerm}%`);
            }
            
            // Apply dynamic OR conditions
            if (searchFields.length > 0) {
              query = query.or(searchFields.join(','));
            }
          }
        }

        if (filters.activeBrandName) {
          query = query.eq('brand', filters.activeBrandName);
        }

        if (filters.activeModelName) {
          query = query.eq('model', filters.activeModelName);
        }

        query = query.range(from, to);

        const { data, error } = await query;
        
        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }
        
        const dataWithSortedImages = data?.map(product => ({
          ...product,
          product_images: product.product_images?.sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return 0;
          })
        }));
        
        timer.end();
        return dataWithSortedImages || [];
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
    setSelectedBrand(null);
    setSelectedModel(null);
    setActiveBrand(null);
    setActiveModel(null);
  }, []);

  const handleSearch = useCallback(() => {
    setActiveSearchTerm(searchTerm);
    setActiveBrand(selectedBrand);
    setActiveModel(selectedModel);
  }, [searchTerm, selectedBrand, selectedModel]);

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
    setSelectedBrand,
    selectedModel,
    setSelectedModel,
    activeBrand,
    activeModel,
    activeBrandName,
    activeModelName,
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
    prefetchNextPage, // New method for prefetching
    isActiveFilters: !!(activeSearchTerm || hideSoldProducts || activeBrandName || activeModelName)
  };
};

export default useCatalogProducts;
