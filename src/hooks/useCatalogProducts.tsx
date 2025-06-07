
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
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
}

export const useCatalogProducts = ({ 
  productsPerPage = 8, 
  sortBy = 'newest',
  externalSelectedBrand = null,
  externalSelectedModel = null,
  findBrandNameById,
  findModelNameById
}: UseCatalogProductsProps = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [hideSoldProducts, setHideSoldProducts] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAdminAccess();

  // Use external brand/model values if provided, otherwise use internal state
  const [internalSelectedBrand, setInternalSelectedBrand] = useState<string | null>(null);
  const [internalSelectedModel, setInternalSelectedModel] = useState<string | null>(null);

  const selectedBrand = externalSelectedBrand !== undefined ? externalSelectedBrand : internalSelectedBrand;
  const selectedModel = externalSelectedModel !== undefined ? externalSelectedModel : internalSelectedModel;

  // Convert brand and model IDs to names for database query
  const selectedBrandName = findBrandNameById ? findBrandNameById(selectedBrand) : selectedBrand;
  const selectedModelName = findModelNameById ? findModelNameById(selectedModel) : selectedModel;

  // Helper function to build sort query
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

  // Memoize filters
  const filters = useMemo(() => {
    const filtersObj = {
      activeSearchTerm,
      hideSoldProducts,
      selectedBrandName,
      selectedModelName,
      sortBy,
      isAdmin
    };
    console.log('📋 Filters updated:', filtersObj);
    return filtersObj;
  }, [activeSearchTerm, hideSoldProducts, selectedBrandName, selectedModelName, sortBy, isAdmin]);

  // Use React Query for data fetching with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const from = pageParam * productsPerPage;
        const to = from + productsPerPage - 1;
        
        console.log('🔎 Executing search query with filters:', {
          searchQuery: filters.activeSearchTerm,
          selectedBrandName: filters.selectedBrandName,
          selectedModelName: filters.selectedModelName,
          hideSoldProducts: filters.hideSoldProducts,
          page: pageParam
        });
        
        let query = supabase
          .from('products')
          .select('*, product_images(url, is_primary), cloudinary_public_id, cloudinary_url');

        // Apply sorting
        query = buildSortQuery(query, sortBy);

        // Apply status filtering
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
          console.log('🔍 Applied text search:', searchTerm);
        }

        // Apply brand filter - now using text name instead of ID
        if (filters.selectedBrandName) {
          query = query.eq('brand', filters.selectedBrandName);
          console.log('🏷️ Applied brand filter:', filters.selectedBrandName);
        }

        // Apply model filter - now using text name instead of ID
        if (filters.selectedModelName) {
          query = query.eq('model', filters.selectedModelName);
          console.log('🚗 Applied model filter:', filters.selectedModelName);
        }

        const { data, error } = await query.range(from, to);
        
        if (error) {
          console.error('❌ Error fetching products:', error);
          throw new Error('Failed to fetch products');
        }
        
        console.log('✅ Products fetched successfully:', data?.length, 'items');
        return data || [];
      } catch (error) {
        console.error('💥 Error in queryFn:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 180000,
    refetchOnWindowFocus: false
  });

  // Get all products from all pages
  const allProducts = data?.pages.flat() || [];
  
  // Map products to the correct format
  const mappedProducts: ProductProps[] = useMemo(() => {
    return allProducts.map((product) => {
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
  }, [allProducts]);

  // Chunking logic for better performance
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
    setActiveSearchTerm('');
    if (externalSelectedBrand === undefined) setInternalSelectedBrand(null);
    if (externalSelectedModel === undefined) setInternalSelectedModel(null);
  }, [externalSelectedBrand, externalSelectedModel]);

  const handleSearch = useCallback(() => {
    setActiveSearchTerm(searchTerm);
    console.log('🔍 Search executed:', searchTerm);
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
    refetch,
    handleClearSearch,
    handleSearch,
    handleSearchSubmit,
    isActiveFilters: !!(activeSearchTerm || hideSoldProducts || selectedBrandName || selectedModelName)
  };
};

export default useCatalogProducts;
