import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/product/ProductGrid";
import { Search, X, Filter, Clock, ShoppingBag, Award, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersection } from "@/hooks/useIntersection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductProps } from "@/types/product";

type Product = Database["public"]["Tables"]["products"]["Row"];

// Оптимизированный компонент заглушки
const ProductSkeleton = () => (
  <div className="bg-white rounded-xl shadow-card overflow-hidden">
    <Skeleton className="h-[240px] w-full" />
    <div className="p-4">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

// Компонент RequestPartsPromo вынесен в отдельный мемоизированный компонент
const RequestPartsPromo = React.memo(() => (
  <div className="relative overflow-hidden rounded-xl mb-8 p-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-fade-in">
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
    
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Не можете найти нужную запчасть?</h2>
        <div className="text-white/90 max-w-2xl space-y-3">
          <p className="text-lg font-medium leading-relaxed animate-fade-in" style={{animationDelay: '100ms'}}>
            <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent font-semibold">Оставьте запрос и получите предложения от 100+ продавцов</span> — быстро и без лишних усилий!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Clock className="h-4 w-4 text-amber-200" />
              </div>
              <p className="text-sm">Предложения в течение минут</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <ShoppingBag className="h-4 w-4 text-amber-200" />
              </div>
              <p className="text-sm">Огромный выбор запчастей</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-full">
                <Award className="h-4 w-4 text-amber-200" />
              </div>
              <p className="text-sm">Лучшие цены на partsbay.ae</p>
            </div>
          </div>
        </div>
      </div>
      
      <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg" asChild>
        <Link to="/requests/create">
          <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
          <Send className="mr-2 h-4 w-4" />
          Оставить запрос
        </Link>
      </Button>
    </div>
  </div>
));

// Определяем интерфейс для фильтров
interface CatalogFilters {
  searchQuery: string;
  selectedBrand: string | null;
  selectedModel: string | null;
  hideSoldProducts: boolean;
}

const Catalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hideSoldProducts, setHideSoldProducts] = useState(false);
  const productsPerPage = 8;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Car brands and models state
  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading: isLoadingBrands
  } = useCarBrandsAndModels();
  
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Reset model when brand changes
  useEffect(() => {
    setSelectedModel(null);
  }, [selectedBrand]);

  // Оптимизация: Используем useCallback для debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // When debouncedSearchQuery, selectedBrand, or selectedModel changes, update hasSearched state
  useEffect(() => {
    if (debouncedSearchQuery || selectedBrand || selectedModel) {
      setHasSearched(true);
    }
  }, [debouncedSearchQuery, selectedBrand, selectedModel]);

  // Оптимизация: Мемоизируем объект с фильтрами для использования в query key
  const filters = useMemo(() => ({
    debouncedSearchQuery,
    selectedBrand,
    selectedModel,
    hideSoldProducts
  }), [debouncedSearchQuery, selectedBrand, selectedModel, hideSoldProducts]);

  // Define our product type more explicitly for type safety
  type ProductType = {
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

  // Оптимизация: Используем useInfiniteQuery для подгрузки данных по мере прокрутки
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ["products-infinite", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * productsPerPage;
      const to = from + productsPerPage - 1;
      
      // Оптимизация: Удаляем лишние console.log в production
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching catalog products: ${from} to ${to}`);
        console.log(`Search criteria:`, filters);
      }
      
      let query = supabase
        .from("products")
        .select("*, product_images(url, is_primary, preview_url), profiles:seller_id(*)")
        .order("created_at", { ascending: false });

      // Filter out sold products if checkbox is checked
      if (filters.hideSoldProducts) {
        query = query.eq('status', 'active');
      } else {
        query = query.in('status', ['active', 'sold']);
      }

      // Apply search filters
      if (filters.debouncedSearchQuery || filters.selectedBrand || filters.selectedModel) {
        let conditions = [];
        
        // Text search with partial matching
        if (filters.debouncedSearchQuery) {
          // Оптимизация: Используем более эффективный поиск
          conditions.push(`title.ilike.%${filters.debouncedSearchQuery}%`);
          conditions.push(`brand.ilike.%${filters.debouncedSearchQuery}%`);
          conditions.push(`model.ilike.%${filters.debouncedSearchQuery}%`);
          
          // Try to handle possible typos by checking for similar terms (simplified approach)
          // This splits the search query into words and searches for each word separately
          const searchTerms = filters.debouncedSearchQuery.trim().split(/\s+/).filter(t => t.length > 2);
          searchTerms.forEach(term => {
            // For each term longer than 2 chars, create a fuzzy search condition
            if (term.length > 2) {
              conditions.push(`title.ilike.%${term.substring(0, term.length-1)}%`); // Match with last char removed
              conditions.push(`brand.ilike.%${term.substring(0, term.length-1)}%`);
              conditions.push(`model.ilike.%${term.substring(0, term.length-1)}%`);
            }
          });
        }
        
        // Brand filter
        if (filters.selectedBrand) {
          const brand = brands.find(b => b.id === filters.selectedBrand);
          if (brand) {
            query = query.ilike('brand', `%${brand.name}%`);
          }
        }
        
        // Model filter (only if brand is selected)
        if (filters.selectedModel && filters.selectedBrand) {
          const model = brandModels.find(m => m.id === filters.selectedModel);
          if (model) {
            query = query.ilike('model', `%${model.name}%`);
          }
        }
        
        // Apply text search conditions with OR logic
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }

      const { data, error } = await query.range(from, to);
      
      if (error) {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
      }
      
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    // Note: keepPreviousData is not supported in React Query v5 for useInfiniteQuery
    // Use placeholderData instead for similar functionality
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });

  // Subscribe to real-time product insertions for debugging
  useEffect(() => {
    // Оптимизация: Включаем realtime только в development
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
          console.log("Catalog detected new product insertion:", {
            id: newProduct.id,
            title: newProduct.title,
            brand: newProduct.brand,
            model: newProduct.model,
            status: newProduct.status
          });
          
          toast({
            title: "Новый товар добавлен",
            description: `Добавлен товар: ${newProduct.title}`,
          });
          
          // Refresh the query to include the new product
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      // Оптимизация: Убираем лишние логи
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  const handleLoadMoreClick = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    selectBrand(null); // Using selectBrand from the hook
    setSelectedModel(null);
    setHasSearched(false);
  }, [selectBrand]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // When user explicitly submits search, we update hasSearched
    setHasSearched(!!(searchQuery || selectedBrand || selectedModel));
    // Force refetch
    refetch();
    
    // Close mobile keyboard if applicable
    if (isMobile) {
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
    }
  }, [searchQuery, selectedBrand, selectedModel, refetch, isMobile]);

  // Оптимизация: Мемоизируем маппинг продуктов
  const allProducts = data?.pages.flat() || [];
  
  const mappedProducts = useMemo(() => {
    return allProducts.map((product) => {
      // Cast product to our known type
      const typedProduct = product as unknown as ProductType;
      
      let imageUrl = "/placeholder.svg";
      let previewUrl = null;
      
      if (typedProduct.product_images && typedProduct.product_images.length > 0) {
        // Ищем превью для оптимизированного отображения
        for (const img of typedProduct.product_images) {
          if (img.preview_url) {
            previewUrl = img.preview_url;
            if (img.is_primary) break; // Если это основное изображение с превью, прерываем поиск
          }
        }
        
        // Ищем основное изображение
        const primaryImage = typedProduct.product_images.find(img => img.is_primary);
        if (primaryImage) {
          imageUrl = primaryImage.url;
        } else if (typedProduct.product_images[0]) {
          imageUrl = typedProduct.product_images[0].url;
        }
      }
      
      const sellerLocation = typedProduct.profiles?.location || typedProduct.location || "Dubai";
      
      return {
        id: typedProduct.id,
        name: typedProduct.title,
        price: Number(typedProduct.price),
        image: imageUrl,
        preview_image: previewUrl, // Используем превью для отображения в каталоге
        condition: typedProduct.condition as "Новый" | "Б/У" | "Восстановленный",
        location: sellerLocation,
        seller_opt_id: typedProduct.profiles?.opt_id,
        seller_rating: typedProduct.profiles?.rating,
        optid_created: typedProduct.optid_created,
        rating_seller: typedProduct.rating_seller,
        brand: typedProduct.brand || "",
        model: typedProduct.model || "",
        seller_name: typedProduct.seller_name,
        status: typedProduct.status,
        seller_id: typedProduct.seller_id,
        seller_verification: typedProduct.profiles?.verification_status,
        seller_opt_status: typedProduct.profiles?.opt_status,
        created_at: typedProduct.created_at,
        delivery_price: typedProduct.delivery_price,
        has_preview: typedProduct.has_preview
      } as ProductProps;
    });
  }, [allProducts]);

  // Оптимизация: Мемоизируем разбиение на чанки для рендера
  const productChunks = useMemo(() => {
    // Более эффективный подход к созданию массива чанков
    const chunks = [];
    const chunkSize = 30;
    const total = mappedProducts.length;
    
    for (let i = 0; i < total; i += chunkSize) {
      chunks.push(mappedProducts.slice(i, i + chunkSize));
    }
    
    return chunks;
  }, [mappedProducts]);

  return (
    <Layout>
      <div className="bg-lightGray min-h-screen py-0">
        <div className="container mx-auto px-3 pb-20 pt-8 sm:pt-14">
          <div className="mb-6 flex flex-col gap-4">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="w-full flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Text search input */}
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                    <Search className="h-5 w-5"/>
                  </span>
                  <Input 
                    type="text"
                    placeholder="Поиск по названию, бренду, модели..." 
                    className="pl-10 pr-10 py-2 md:py-3 shadow-sm text-base"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmit(e);
                        if (isMobile) {
                          (e.target as HTMLElement).blur();
                        }
                      }
                    }}
                  />
                  {searchQuery && (
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Mobile filters toggle */}
                <div className="block sm:hidden">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    Фильтры
                  </Button>
                </div>
                
                {/* Desktop filters always visible */}
                <div className="hidden sm:flex gap-3">
                  {/* Brand select */}
                  <Select
                    value={selectedBrand || ""}
                    onValueChange={(value) => selectBrand(value || null)}
                  >
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Марка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-brands">Все марки</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Model select */}
                  <Select
                    value={selectedModel || ""}
                    onValueChange={(value) => setSelectedModel(value || null)}
                    disabled={!selectedBrand}
                  >
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Модель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-models">Все модели</SelectItem>
                      {brandModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                
                  {/* Search button */}
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    <Search className="h-4 w-4 mr-2" />
                    Поиск
                  </Button>
                </div>
              </div>
              
              {/* Mobile filters (collapsible) */}
              {showFilters && (
                <div className="sm:hidden flex flex-col gap-3 p-3 bg-white rounded-lg shadow-sm border animate-fade-in">
                  {/* Brand select */}
                  <Select
                    value={selectedBrand || ""}
                    onValueChange={(value) => selectBrand(value || null)}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Марка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-brands">Все марки</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Model select */}
                  <Select
                    value={selectedModel || ""}
                    onValueChange={(value) => setSelectedModel(value || null)}
                    disabled={!selectedBrand}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Модель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-models">Все модели</SelectItem>
                      {brandModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Search button */}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    <Search className="h-4 w-4 mr-2" />
                    Поиск
                  </Button>
                </div>
              )}
            </form>

            {/* Hide sold products checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hide-sold" 
                checked={hideSoldProducts}
                onCheckedChange={(checked) => setHideSoldProducts(checked === true)}
              />
              <Label htmlFor="hide-sold" className="text-sm cursor-pointer">
                Не показывать проданные
              </Label>
            </div>

            {/* Active filters display */}
            {(searchQuery || selectedBrand || selectedModel) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Активные фильтры:</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                      Запрос: {searchQuery}
                    </div>
                  )}
                  {selectedBrand && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                      Марка: {brands.find(b => b.id === selectedBrand)?.name}
                    </div>
                  )}
                  {selectedModel && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                      Модель: {brandModels.find(m => m.id === selectedModel)?.name}
                    </div>
                  )}
                  {hideSoldProducts && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center">
                      Без проданных товаров
                    </div>
                  )}
                  <button 
                    onClick={handleClearSearch}
                    className="text-blue-600 underline hover:text-blue-800 text-sm"
                  >
                    Сбросить все
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {isLoading && (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="text-lg text-red-600">Ошибка при загрузке товаров</p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          {!isLoading && !isError && hasSearched && (debouncedSearchQuery || selectedBrand || selectedModel) && allProducts.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-lg text-gray-800">Товары не найдены</p>
              <p className="text-gray-500 mt-2">Попр��буйте изменить параметры поиска</p>
              
              {/* Show RequestPartsPromo when no search results are found */}
              <div className="mt-10">
                <RequestPartsPromo />
              </div>
            </div>
          )}
          
          {!isLoading && allProducts.length > 0 && (
            <div className="animate-fade-in space-y-12">
              {productChunks.map((chunk, chunkIndex) => (
                <ProductGrid key={`chunk-${chunkIndex}`} products={chunk} />
              ))}
              
              {/* Show RequestPartsPromo after products when search was performed */}
              {hasSearched && (
                <div className="mt-6">
                  <RequestPartsPromo />
                </div>
              )}
            </div>
          )}
          
          {(hasNextPage || isFetchingNextPage) && (
            <div className="mt-8 flex flex-col items-center justify-center">
              <div 
                ref={loadMoreRef} 
                className="h-20 w-full flex items-center justify-center"
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-t-link rounded-full animate-spin"></div>
                    <span className="ml-3 text-muted-foreground">Загрузка товаров...</span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleLoadMoreClick}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Загрузить ещё
                  </Button>
                )}
              </div>
            </div>
          )}

          {!hasNextPage && !isLoading && allProducts.length > 0 && (
            <div className="text-center py-8 text-gray-600">
              Вы просмотрели все доступные товары
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Catalog;
