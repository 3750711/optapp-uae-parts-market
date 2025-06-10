
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProductProps } from '@/components/product/ProductCard';
import { SortOption } from '@/components/catalog/ProductSorting';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useDebounceValue } from '@/hooks/useDebounceValue';

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
};

export interface CatalogFilters {
  activeSearchTerm: string;
  hideSoldProducts: boolean;
  selectedBrand?: string | null;
  selectedModel?: string | null;
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
  productsPerPage = 8, 
  sortBy = 'newest',
  externalSelectedBrand = null,
  externalSelectedModel = null,
  findBrandNameById,
  findModelNameById,
  debounceTime = 500
}: UseCatalogProductsProps = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, debounceTime);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [hideSoldProducts, setHideSoldProducts] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAdminAccess();
  const isInitialRender = useRef(true);
  
  const [internalSelectedBrand, setInternalSelectedBrand] = useState<string | null>(null);
  const [internalSelectedModel, setInternalSelectedModel] = useState<string | null>(null);

  const selectedBrand = externalSelectedBrand !== undefined ? externalSelectedBrand : internalSelectedBrand;
  const selectedModel = externalSelectedModel !== undefined ? externalSelectedModel : internalSelectedModel;

  const selectedBrandName = findBrandNameById ? findBrandNameById(selectedBrand) : selectedBrand;
  const selectedModelName = findModelNameById ? findModelNameById(selectedModel) : selectedModel;

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    if (debouncedSearchTerm !== activeSearchTerm) {
      setActiveSearchTerm(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, activeSearchTerm]);

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
      selectedBrandName,
      selectedModelName,
      sortBy,
      isAdmin
    };
    console.log('📋 Catalog filters updated:', filtersObj);
    return filtersObj;
  }, [activeSearchTerm, hideSoldProducts, selectedBrandName, selectedModelName, sortBy, isAdmin]);

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
      try {
        const from = pageParam * productsPerPage;
        const to = from + productsPerPage - 1;
        
        console.log('🔎 Executing product search with:', {
          searchQuery: filters.activeSearchTerm,
          selectedBrandName: filters.selectedBrandName,
          selectedModelName: filters.selectedModelName,
          hideSoldProducts: filters.hideSoldProducts,
          page: pageParam,
          from,
          to,
          isAdmin: filters.isAdmin
        });
        
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
            product_images(url, is_primary)
          `);

        query = buildSortQuery(query, sortBy);

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

        // Apply search filters
        if (filters.activeSearchTerm) {
          const searchTerm = filters.activeSearchTerm.trim();
          query = query.or(`title.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
        }

        if (filters.selectedBrandName) {
          query = query.eq('brand', filters.selectedBrandName);
        }

        if (filters.selectedModelName) {
          query = query.eq('model', filters.selectedModelName);
        }

        query = query.range(from, to);

        console.log('📡 Starting Supabase query...');
        const { data, error } = await query;
        
        if (error) {
          console.error('❌ Supabase query error:', error);
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
        
        console.log('✅ Products loaded successfully:', {
          count: dataWithSortedImages?.length || 0,
          hasData: (dataWithSortedImages?.length || 0) > 0,
          firstProduct: dataWithSortedImages?.[0]?.title
        });
        
        return dataWithSortedImages || [];
      } catch (error) {
        console.error('💥 Product loading error:', error);
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
    staleTime: 30000, // Reduced from 3 minutes to 30 seconds for better data freshness
    gcTime: 60000, // Reduced garbage collection time
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.log(`⚠️ Query retry attempt ${failureCount + 1}:`, error);
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000)
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
        
        return {
          id: typedProduct.id,
          title: typedProduct.title,
          price: Number(typedProduct.price),
          brand: typedProduct.brand || "",
          model: typedProduct.model || "",
          seller_name: typedProduct.seller_name,
          status: typedProduct.status,
          seller_id: typedProduct.seller_id,
          delivery_price: typedProduct.delivery_price,
          optid_created: typedProduct.optid_created,
          cloudinary_public_id: typedProduct.cloudinary_public_id,
          cloudinary_url: typedProduct.cloudinary_url,
          rating_seller: typedProduct.rating_seller,
          product_images: typedProduct.product_images?.map(img => ({
            id: '',
            url: img.url,
            is_primary: img.is_primary || false
          }))
        } as ProductProps;
      });
      
      console.log('🔄 Products mapped:', {
        originalCount: allProducts.length,
        mappedCount: mapped.length,
        hasValidData: mapped.length > 0
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
    
    console.log('📦 Product chunks created:', {
      totalProducts: mappedProducts.length,
      chunksCount: chunks.length,
      chunkSize
    });
    
    return chunks;
  }, [mappedProducts]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    if (externalSelectedBrand === undefined) setInternalSelectedBrand(null);
    if (externalSelectedModel === undefined) setInternalSelectedModel(null);
  }, [externalSelectedBrand, externalSelectedModel]);

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
    setSelectedBrand: externalSelectedBrand === undefined ? setInternalSelectedBrand : () => {},
    selectedModel,
    setSelectedModel: externalSelectedModel === undefined ? setInternalSelectedModel : () => {},
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
    isActiveFilters: !!(activeSearchTerm || hideSoldProducts || selectedBrandName || selectedModelName)
  };
};

export default useCatalogProducts;
