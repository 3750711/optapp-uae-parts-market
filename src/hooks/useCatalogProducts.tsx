
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProductProps } from '@/components/product/ProductCard';
import { SortOption } from '@/components/catalog/ProductSorting';

export type ProductType = {
  id: string;
  title: string;
  price: number | string;
  product_images?: { url: string; is_primary?: boolean; preview_url?: string }[];
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
  has_preview?: boolean;
};

export interface CatalogFilters {
  searchQuery: string;
  selectedBrand: string | null;
  selectedModel: string | null;
  hideSoldProducts: boolean;
  selectedBrandName: string | null;
  selectedModelName: string | null;
}

export const useCatalogProducts = (productsPerPage = 8, sortBy: SortOption = 'newest') => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null);
  const [hideSoldProducts, setHideSoldProducts] = useState(false);
  const { toast } = useToast();

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Track if user has searched
  useEffect(() => {
    if (debouncedSearchQuery || selectedBrand || selectedModel) {
      setHasSearched(true);
    }
  }, [debouncedSearchQuery, selectedBrand, selectedModel]);

  // Reset model when brand changes
  useEffect(() => {
    setSelectedModel(null);
    setSelectedModelName(null);
  }, [selectedBrand]);

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

  // Memoize filters to use in query key - now includes sortBy
  const filters = useMemo(() => ({
    debouncedSearchQuery,
    selectedBrand,
    selectedModel,
    hideSoldProducts,
    selectedBrandName,
    selectedModelName,
    sortBy
  }), [debouncedSearchQuery, selectedBrand, selectedModel, hideSoldProducts, selectedBrandName, selectedModelName, sortBy]);

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
      const from = pageParam * productsPerPage;
      const to = from + productsPerPage - 1;
      
      let query = supabase
        .from('products')
        .select('*, product_images(url, is_primary, preview_url), profiles:seller_id(*)');

      // Apply sorting
      query = buildSortQuery(query, sortBy);

      // Filter out sold products if checkbox is checked
      if (filters.hideSoldProducts) {
        query = query.eq('status', 'active');
      } else {
        query = query.in('status', ['active', 'sold']);
      }

      // Apply search filters
      if (filters.debouncedSearchQuery || filters.selectedBrandName || filters.selectedModelName) {
        let conditions = [];
        
        // Text search with partial matching
        if (filters.debouncedSearchQuery) {
          // Use more efficient search
          conditions.push(`title.ilike.%${filters.debouncedSearchQuery}%`);
          conditions.push(`brand.ilike.%${filters.debouncedSearchQuery}%`);
          conditions.push(`model.ilike.%${filters.debouncedSearchQuery}%`);
          
          // Handle possible typos by checking for similar terms
          const searchTerms = filters.debouncedSearchQuery.trim().split(/\s+/).filter(t => t.length > 2);
          searchTerms.forEach(term => {
            if (term.length > 2) {
              conditions.push(`title.ilike.%${term.substring(0, term.length-1)}%`);
              conditions.push(`brand.ilike.%${term.substring(0, term.length-1)}%`);
              conditions.push(`model.ilike.%${term.substring(0, term.length-1)}%`);
            }
          });
        }
        
        // Log search parameters for debugging
        console.log('Search filters:', {
          brandId: filters.selectedBrand,
          brandName: filters.selectedBrandName,
          modelId: filters.selectedModel,
          modelName: filters.selectedModelName
        });
        
        // Brand filter - now using the actual brand name
        if (filters.selectedBrandName) {
          console.log('Filtering by brand name:', filters.selectedBrandName);
          query = query.ilike('brand', filters.selectedBrandName);
        }
        
        // Model filter - now using the actual model name
        if (filters.selectedModelName && filters.selectedBrandName) {
          console.log('Filtering by model name:', filters.selectedModelName);
          query = query.ilike('model', filters.selectedModelName);
        }
        
        // Apply text search conditions with OR logic
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      console.log('Final query filters:', query);
      const { data, error } = await query.range(from, to);
      
      if (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products');
      }
      
      console.log(`Fetched ${data?.length || 0} products for page ${pageParam}`);
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 180000, // 3 minutes
    refetchOnWindowFocus: false
  });

  // Subscribe to real-time product insertions for debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const channel = supabase
      .channel('catalog-debug')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          const newProduct = payload.new as any;
          toast({
            title: "Новый товар добавлен",
            description: `Добавлен товар: ${newProduct.title}`,
          });
          
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedBrandName(null);
    setSelectedModelName(null);
    setHasSearched(false);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // When user explicitly submits search, we update hasSearched
    setHasSearched(!!(searchQuery || selectedBrand || selectedModel));
    // Force refetch
    refetch();
  }, [searchQuery, selectedBrand, selectedModel, refetch]);

  // Map products to the correct format with optimized memo
  const allProducts = data?.pages.flat() || [];
  
  const mappedProducts: ProductProps[] = useMemo(() => {
    return allProducts.map((product) => {
      // Cast product to our known type
      const typedProduct = product as unknown as ProductType;
      
      let imageUrl = "/placeholder.svg";
      let previewUrl = null;
      
      if (typedProduct.product_images && typedProduct.product_images.length > 0) {
        // Find preview for optimized display
        for (const img of typedProduct.product_images) {
          if (img.preview_url) {
            previewUrl = img.preview_url;
            if (img.is_primary) break; // Stop if this is the primary image with preview
          }
        }
        
        // Find primary image
        const primaryImage = typedProduct.product_images.find(img => img.is_primary);
        if (primaryImage) {
          imageUrl = primaryImage.url;
        } else if (typedProduct.product_images[0]) {
          imageUrl = typedProduct.product_images[0].url;
        }
      }
      
      return {
        id: typedProduct.id,
        title: typedProduct.title,
        price: Number(typedProduct.price),
        image: imageUrl,
        preview_image: previewUrl, // Use preview for catalog display
        brand: typedProduct.brand || "",
        model: typedProduct.model || "",
        seller_name: typedProduct.seller_name,
        status: typedProduct.status,
        seller_id: typedProduct.seller_id,
        delivery_price: typedProduct.delivery_price,
        optid_created: typedProduct.optid_created
      } as ProductProps;
    });
  }, [allProducts]);

  // Split products into chunks for better rendering performance
  const productChunks = useMemo(() => {
    const chunks = [];
    const chunkSize = 30;
    const total = mappedProducts.length;
    
    for (let i = 0; i < total; i += chunkSize) {
      chunks.push(mappedProducts.slice(i, i + chunkSize));
    }
    
    return chunks;
  }, [mappedProducts]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    hasSearched,
    selectedBrand,
    setSelectedBrand: (brand: string | null) => {
      setSelectedBrand(brand);
    },
    selectedModel,
    setSelectedModel,
    selectedBrandName,
    setSelectedBrandName,
    selectedModelName,
    setSelectedModelName,
    hideSoldProducts,
    setHideSoldProducts,
    allProducts,
    mappedProducts,
    productChunks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    handleClearSearch,
    handleSearchSubmit,
    isActiveFilters: !!(searchQuery || selectedBrand || selectedModel || hideSoldProducts)
  };
};

export default useCatalogProducts;
