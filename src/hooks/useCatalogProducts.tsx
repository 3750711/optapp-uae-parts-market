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
  const { isAdmin } = useAdminAccess();

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
    sortBy,
    isAdmin
  }), [debouncedSearchQuery, selectedBrand, selectedModel, hideSoldProducts, selectedBrandName, selectedModelName, sortBy, isAdmin]);

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

      // UNIFIED FILTERING LOGIC - handle all status filtering here
      if (filters.hideSoldProducts) {
        query = query.eq('status', 'active');
      } else {
        // Show different products based on admin status
        if (filters.isAdmin) {
          // Admin can see all products
          query = query.in('status', ['active', 'sold', 'pending', 'archived']);
        } else {
          // Regular users only see active and sold products
          query = query.in('status', ['active', 'sold']);
        }
      }

      // Apply search filters
      if (filters.debouncedSearchQuery || filters.selectedBrandName || filters.selectedModelName) {
        let conditions = [];
        
        // Text search with partial matching
        if (filters.debouncedSearchQuery) {
          conditions.push(`title.ilike.%${filters.debouncedSearchQuery}%`);
          conditions.push(`brand.ilike.%${filters.debouncedSearchQuery}%`);
          conditions.push(`model.ilike.%${filters.debouncedSearchQuery}%`);
          
          const searchTerms = filters.debouncedSearchQuery.trim().split(/\s+/).filter(t => t.length > 2);
          searchTerms.forEach(term => {
            if (term.length > 2) {
              conditions.push(`title.ilike.%${term.substring(0, term.length-1)}%`);
              conditions.push(`brand.ilike.%${term.substring(0, term.length-1)}%`);
              conditions.push(`model.ilike.%${term.substring(0, term.length-1)}%`);
            }
          });
        }
        
        // Brand filter
        if (filters.selectedBrandName) {
          query = query.ilike('brand', filters.selectedBrandName);
        }
        
        // Model filter
        if (filters.selectedModelName && filters.selectedBrandName) {
          query = query.ilike('model', filters.selectedModelName);
        }
        
        // Apply text search conditions with OR logic
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

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
    staleTime: 180000,
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

  // Get all products from all pages
  const allProducts = data?.pages.flat() || [];
  
  // Map products to the correct format with better image handling
  const mappedProducts: ProductProps[] = useMemo(() => {
    const products = allProducts.map((product) => {
      const typedProduct = product as unknown as ProductType;
      
      let imageUrl = "/placeholder.svg";
      let previewUrl = null;
      
      if (typedProduct.product_images && typedProduct.product_images.length > 0) {
        // Find preview for optimized display
        for (const img of typedProduct.product_images) {
          if (img.preview_url) {
            previewUrl = img.preview_url;
            if (img.is_primary) break;
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
        preview_image: previewUrl,
        brand: typedProduct.brand || "",
        model: typedProduct.model || "",
        seller_name: typedProduct.seller_name,
        status: typedProduct.status,
        seller_id: typedProduct.seller_id,
        delivery_price: typedProduct.delivery_price,
        optid_created: typedProduct.optid_created
      } as ProductProps;
    });

    console.log(`Mapped ${products.length} products total`);
    return products;
  }, [allProducts]);

  // Optimized chunking logic - ensure even distribution
  const productChunks = useMemo(() => {
    const chunks = [];
    const chunkSize = 20; // Larger chunks for better performance
    const total = mappedProducts.length;
    
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = mappedProducts.slice(i, i + chunkSize);
      chunks.push(chunk);
      console.log(`Chunk ${chunks.length}: ${chunk.length} products`);
    }
    
    console.log(`Created ${chunks.length} chunks from ${total} products`);
    return chunks;
  }, [mappedProducts]);

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
    setHasSearched(!!(searchQuery || selectedBrand || selectedModel));
    refetch();
  }, [searchQuery, selectedBrand, selectedModel, refetch]);

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
    allProducts: mappedProducts, // Return already filtered products
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
