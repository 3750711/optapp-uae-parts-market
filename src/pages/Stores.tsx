
import React, { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useIntersection } from "@/hooks/useIntersection";
import { supabase } from "@/integrations/supabase/client";
import { StoreCard } from "@/components/store/StoreCard";
import { StoreWithImages } from "@/types/store";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Stores = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const storesPerPage = 6;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ["stores-infinite", debouncedSearchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * storesPerPage;
      const to = from + storesPerPage - 1;
      
      console.log(`Fetching stores: ${from} to ${to}`);
      let query = supabase
        .from("stores")
        .select("*, store_images(*)")
        .order("created_at", { ascending: false });

      if (debouncedSearchQuery) {
        query = query.or(
          `name.ilike.%${debouncedSearchQuery}%,` +
          `description.ilike.%${debouncedSearchQuery}%,` +
          `address.ilike.%${debouncedSearchQuery}%`
        );
      }

      const { data, error } = await query.range(from, to);
      
      if (error) {
        console.error("Error fetching stores:", error);
        throw new Error("Failed to fetch stores");
      }
      
      return data as StoreWithImages[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === storesPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0
  });

  useEffect(() => {
    refetch();
  }, [debouncedSearchQuery, refetch]);

  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      console.log("Load more element is visible, fetching next page");
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  const handleLoadMoreClick = () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("Manual load more triggered");
      fetchNextPage();
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleAddStore = () => {
    navigate("/store/create");
  };

  const allStores = data?.pages.flat() || [];
  console.log(`Total stores loaded: ${allStores.length}`);

  return (
    <Layout>
      <div className="bg-lightGray min-h-screen py-0">
        <div className="container mx-auto px-3 pb-20 pt-8 sm:pt-14">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-bold mb-6 md:mb-0">Магазины</h1>
            {user && (
              <Button 
                onClick={handleAddStore}
                className="flex items-center gap-2"
              >
                <Plus size={18} />
                Добавить магазин
              </Button>
            )}
          </div>
          
          <div className="mb-10 flex justify-center">
            <div className="w-full max-w-xl relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                <Search className="h-5 w-5"/>
              </span>
              <Input 
                type="text"
                placeholder="Поиск магазина..." 
                className="pl-10 pr-10 py-2 md:py-3 shadow-sm text-base"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isMobile) {
                      (e.target as HTMLElement).blur();
                    }
                  }
                }}
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {isLoading && (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-card overflow-hidden">
                    <Skeleton className="h-[200px] w-full" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="text-lg text-red-600">Ошибка при загрузке данных</p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          {!isLoading && !isError && allStores.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-lg text-gray-800">Магазины не найдены</p>
              <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
            </div>
          )}
          
          {!isLoading && allStores.length > 0 && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {allStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
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
                    <span className="ml-3 text-muted-foreground">Загрузка...</span>
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

          {!hasNextPage && !isLoading && allStores.length > 0 && (
            <div className="text-center py-8 text-gray-600">
              Вы просмотрели все доступные магазины
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Stores;
