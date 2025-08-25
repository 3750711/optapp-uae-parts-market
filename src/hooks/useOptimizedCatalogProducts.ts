
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProductProps } from '@/components/product/ProductCard';
import { SortOption } from '@/components/catalog/ProductSorting';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export type ProductType = {
  id: string;
  title: string;
  price: number | string;
  product_images?: { url: string; is_primary?: boolean }[];
  product_videos?: { url: string }[];
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
  updated_at?: string;
  delivery_price?: number | null;
  cloudinary_public_id?: string | null;
  cloudinary_url?: string | null;
  lot_number?: number;
  place_number?: number;
  view_count?: number;
  product_location?: string;
  telegram_url?: string;
  phone_url?: string;
  description?: string;
};

export interface CatalogFilters {
  searchTerm: string;
  hideSoldProducts: boolean;
  selectedBrand?: string | null;
  selectedModel?: string | null;
}

interface UseOptimizedCatalogProductsProps {
  productsPerPage?: number;
  sortBy?: SortOption;
  externalSelectedBrand?: string | null;
  externalSelectedModel?: string | null;
  findBrandNameById?: (brandId: string | null) => string | null;
  findModelNameById?: (modelId: string | null) => string | null;
}

// Helper function to safely escape search terms for PostgREST
const escapePostgRESTTerm = (term: string): string => {
  // Escape special PostgREST characters: * % " '
  return term.replace(/[*%"']/g, '\\$&');
};

// Helper function to normalize Cyrillic characters
const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/Ё/g, 'Е');
};

export const useOptimizedCatalogProducts = ({ 
  productsPerPage = 8, 
  sortBy = 'newest',
  externalSelectedBrand = null,
  externalSelectedModel = null,
  findBrandNameById,
  findModelNameById
}: UseOptimizedCatalogProductsProps = {}) => {
  // Simplified state management - single search term
  const [searchTerm, setSearchTerm] = useState('');
  const [hideSoldProducts, setHideSoldProducts] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAdminAccess();
  
  const [internalSelectedBrand, setInternalSelectedBrand] = useState<string | null>(null);
  const [internalSelectedModel, setInternalSelectedModel] = useState<string | null>(null);

  const selectedBrand = externalSelectedBrand !== undefined ? externalSelectedBrand : internalSelectedBrand;
  const selectedModel = externalSelectedModel !== undefined ? externalSelectedModel : internalSelectedModel;

  const selectedBrandName = findBrandNameById ? findBrandNameById(selectedBrand) : selectedBrand;
  const selectedModelName = findModelNameById ? findModelNameById(selectedModel) : selectedModel;

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

  const applySearchFilters = (query: any, filters: any) => {
    // Apply status filters
    if (filters.hideSoldProducts) {
      query = query.eq('status', 'active');
    } else {
      if (filters.isAdmin) {
        query = query.in('status', ['active', 'sold', 'pending', 'archived']);
      } else {
        query = query.in('status', ['active', 'sold']);
      }
    }
    
    // Apply search term filters with enhanced security and logic
    if (filters.searchTerm && filters.searchTerm.length >= 2) {
      const searchTerm = filters.searchTerm.trim();
      const normalizedTerm = normalizeText(searchTerm);
      const escapedTerm = escapePostgRESTTerm(normalizedTerm);
      
      console.log('🔍 Search term processing:', {
        original: searchTerm,
        normalized: normalizedTerm,
        escaped: escapedTerm
      });
      
      // Check if search term is purely numeric for lot_number exact match
      const isNumeric = /^\d+$/.test(searchTerm);
      
      // Build search conditions with correct PostgREST syntax
      let searchConditions: string[] = [];
      
      // Add text-based searches with correct PostgREST ilike syntax
      searchConditions.push(`title.ilike.*${escapedTerm}*`);
      searchConditions.push(`brand.ilike.*${escapedTerm}*`);
      searchConditions.push(`model.ilike.*${escapedTerm}*`);
      searchConditions.push(`seller_name.ilike.*${escapedTerm}*`);
      
      // Only search description if it's not null
      searchConditions.push(`description.ilike.*${escapedTerm}*`);
      
      // Handle lot_number search - exact match for numbers, text search for mixed
      if (isNumeric) {
        searchConditions.push(`lot_number.eq.${parseInt(searchTerm)}`);
      } else {
        // For non-numeric search terms, don't search lot_number as it's numeric
        // This prevents unnecessary errors
      }
      
      const orCondition = searchConditions.join(',');
      console.log('🔗 Final OR condition:', orCondition);
      
      query = query.or(orCondition);
    }

    // Apply brand filter
    if (filters.selectedBrandName) {
      query = query.eq('brand', filters.selectedBrandName);
    }

    // Apply model filter
    if (filters.selectedModelName) {
      query = query.eq('model', filters.selectedModelName);
    }
    
    return query;
  };

  const filters = useMemo(() => {
    const filtersObj = {
      searchTerm,
      hideSoldProducts,
      selectedBrandName,
      selectedModelName,
      sortBy,
      isAdmin
    };
    return filtersObj;
  }, [searchTerm, hideSoldProducts, selectedBrandName, selectedModelName, sortBy, isAdmin]);

  // Separate query for total count
  const { data: totalCount, isLoading: isCountLoading } = useQuery({
    queryKey: ['products-count', filters],
    queryFn: async () => {
      try {
        console.log('🔢 Executing count query with filters:', filters);
        
        let countQuery = supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Use shared filter function to ensure identical filtering
        countQuery = applySearchFilters(countQuery, filters);

        const { count, error } = await countQuery;
        
        if (error) {
          console.error('❌ Count query error:', error);
          throw new Error(`Count query failed: ${error.message}`);
        }
        
        console.log('📊 Total count result:', count);
        return count || 0;
      } catch (error) {
        console.error('💥 Count loading error:', error);
        return 0;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
    queryKey: ['products-infinite-optimized', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const from = pageParam * productsPerPage;
        const to = from + productsPerPage - 1;
        
        console.log('🔎 Executing optimized product search...');
        const startTime = performance.now();
        
        // Оптимизированный запрос - выбираем только необходимые поля
        const selectFields = [
          'id', 'title', 'price', 'condition', 'brand', 'model',
          'seller_name', 'seller_id', 'status', 'created_at', 'updated_at',
          'rating_seller', 'delivery_price', 'optid_created',
          'cloudinary_public_id', 'cloudinary_url', 'lot_number',
          'place_number', 'view_count', 'product_location', 'telegram_url',
          'phone_url', 'description'
        ].join(', ');
        
        let query = supabase
          .from('products')
          .select(`
            ${selectFields},
            product_images(url, is_primary)
          `);

        // Limit images per product
        query.limit(2, { foreignTable: 'product_images' });

        query = buildSortQuery(query, sortBy);

        // Use shared filter function to ensure identical filtering with count query
        query = applySearchFilters(query, filters);

        query = query.range(from, to);

        const { data, error } = await query;
        
        if (error) {
          console.error('❌ Products query error:', error);
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
        
        const endTime = performance.now();
        console.log(`✅ Products loaded in ${(endTime - startTime).toFixed(2)}ms:`, dataWithSortedImages?.length || 0);
        
        return dataWithSortedImages || [];
      } catch (error) {
        console.error('💥 Product loading error:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // Уменьшено до 2 минут для более актуальных данных
    gcTime: 5 * 60 * 1000, // 5 минут в памяти
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000)
  });

  useEffect(() => {
    if (isError && error) {
      console.error('❌ Product loading error in useEffect:', error);
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
        
        
        const mappedProduct = {
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
          place_number: typedProduct.place_number,
          view_count: typedProduct.view_count,
          product_location: typedProduct.product_location,
          telegram_url: typedProduct.telegram_url,
          phone_url: typedProduct.phone_url,
          description: typedProduct.description,
          created_at: typedProduct.created_at,
          updated_at: typedProduct.updated_at,
          product_images: typedProduct.product_images?.map(img => ({
            id: '',
            url: img.url,
            is_primary: img.is_primary || false
          })),
          product_videos: typedProduct.product_videos
        } as ProductProps;
        
        
        return mappedProduct;
      });
      
      return mapped;
    } catch (mappingError) {
      console.error('❌ Product mapping error:', mappingError);
      return [];
    }
  }, [allProducts]);

  const productChunks = useMemo(() => {
    const chunkSize = 12;
    const chunks = [];
    
    for (let i = 0; i < mappedProducts.length; i += chunkSize) {
      chunks.push(mappedProducts.slice(i, i + chunkSize));
    }
    
    return chunks;
  }, [mappedProducts]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    if (externalSelectedBrand === undefined) setInternalSelectedBrand(null);
    if (externalSelectedModel === undefined) setInternalSelectedModel(null);
  }, [externalSelectedBrand, externalSelectedModel]);

  const handleSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    setSearchTerm(trimmedQuery);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Search is triggered immediately on setSearchTerm
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    hideSoldProducts,
    setHideSoldProducts,
    selectedBrand,
    setSelectedBrand: externalSelectedBrand === undefined ? setInternalSelectedBrand : () => {},
    selectedModel,
    setSelectedModel: externalSelectedModel === undefined ? setInternalSelectedModel : () => {},
    allProducts: mappedProducts,
    mappedProducts,
    productChunks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoading || isCountLoading,
    isError,
    error,
    refetch,
    handleClearSearch,
    handleSearch,
    handleSearchSubmit,
    totalProductsCount: totalCount || mappedProducts.length,
    isActiveFilters: !!(searchTerm || hideSoldProducts || selectedBrandName || selectedModelName)
  };
};

export default useOptimizedCatalogProducts;
