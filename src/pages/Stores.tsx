
import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Filter, Grid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIntersection } from "@/hooks/useIntersection";
import { useIsMobile } from "@/hooks/use-mobile";
import OptimizedImage from "@/components/ui/OptimizedImage";
import StoreCardMobile from "@/components/stores/StoreCardMobile";
import { StoreWithImages } from "@/types/store";

interface StoreData {
  id: string;
  name: string;
  tags?: string[];
  rating?: number;
  address: string;
  created_at: string;
  description?: string;
  location?: string;
  owner_name?: string;
  phone?: string;
  seller_id?: string;
  telegram?: string;
  updated_at?: string;
  verified: boolean;
  store_images?: Array<{
    id: string;
    url: string;
    is_primary?: boolean;
  }>;
  product_count?: number;
}

const Stores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const isMobile = useIsMobile();

  // Изменяем тип ref на HTMLDivElement для совместимости
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "400px");

  const storesPerPage = 12;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["stores-infinite", searchTerm, sortBy, selectedTags],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * storesPerPage;
      const to = from + storesPerPage - 1;

      let query = supabase
        .from("stores")
        .select("*, store_images(*), product_count:products(count)")
        .order(sortBy === "rating" ? "rating" : "name", {
          ascending: sortBy === "name",
        })
        .range(from, to);

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      if (selectedTags.length > 0) {
        query = query.contains("tags", selectedTags);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching stores:", error);
        throw new Error("Failed to fetch stores");
      }

      return data as StoreData[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === storesPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

  const allStores = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allStores.forEach((store) => {
      if (store.tags) {
        store.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [allStores]);

  const filteredStores = useMemo(() => {
    return allStores.filter((store) => {
      if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedTags.length > 0 && (!store.tags || !selectedTags.every(tag => store.tags?.includes(tag)))) {
        return false;
      }
      return true;
    });
  }, [allStores, searchTerm, selectedTags]);

  const handleLoadMore = () => {
    fetchNextPage();
  };

  return (
    <>
      <Helmet>
        <title>Магазины</title>
        <meta name="description" content="Список магазинов" />
      </Helmet>

      <div className="container py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Магазины</h1>
            {filteredStores.length > 0 && (
              <Badge variant="secondary">{filteredStores.length}</Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Поиск магазинов..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Сортировать по" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Рейтингу</SelectItem>
                <SelectItem value="name">Имени</SelectItem>
              </SelectContent>
            </Select>

            {!isMobile && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? <List /> : <Grid />}
              </Button>
            )}
          </div>
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Тэги:</span>
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTagSelect(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-gray-100 aspect-square"
              />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">
              {searchTerm
                ? "Ничего не найдено"
                : "Пока нет ни одного магазина"}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Попробуйте изменить поисковый запрос"
                : "Возвращайтесь позже"}
            </p>
          </div>
        ) : (
          <div
            className={`grid ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            } gap-4`}
          >
            {filteredStores.map((store) => (
              <StoreCardMobile key={store.id} store={store as StoreWithImages} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="text-center">
            {/* Используем div для ref вместо button */}
            <div ref={loadMoreRef} className="w-full flex justify-center">
              {!isFetchingNextPage && (
                <Button onClick={handleLoadMore}>
                  Загрузить еще
                </Button>
              )}
            </div>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="text-center">Загрузка магазинов...</div>
        )}

        {isError && (
          <div className="text-center text-red-500">
            Error: {error?.message}
          </div>
        )}
      </div>
    </>
  );
};

export default Stores;
