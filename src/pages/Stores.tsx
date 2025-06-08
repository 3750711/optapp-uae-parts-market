
import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Store {
  id: string;
  name: string;
  description?: string;
  address: string;
  location?: string;
  phone?: string;
  rating?: number;
  verified: boolean;
  tags?: string[];
  created_at: string;
  store_images?: Array<{
    id: string;
    url: string;
    is_primary?: boolean;
  }>;
}

const Stores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Fetch stores
  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      console.log('🔍 Fetching stores...');
      
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching stores:', error);
        throw error;
      }

      console.log('✅ Stores fetched:', data?.length || 0);
      return data as Store[];
    },
    staleTime: 1000 * 60 * 5, // 5 минут кэширования
  });

  // Filter and sort stores
  const filteredStores = useMemo(() => {
    let result = stores;

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter(store => 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [stores, searchTerm, sortBy]);

  const getMainImageUrl = (store: Store) => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  return (
    <>
      <Helmet>
        <title>Магазины автозапчастей | PartsBay.ae</title>
        <meta name="description" content="Каталог магазинов автозапчастей в ОАЭ. Найдите проверенных продавцов автозапчастей в Дубае." />
      </Helmet>

      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Магазины</h1>
            {filteredStores.length > 0 && (
              <Badge variant="secondary">{filteredStores.length}</Badge>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Поиск магазинов..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Сортировать по" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">По названию</SelectItem>
              <SelectItem value="rating">По рейтингу</SelectItem>
              <SelectItem value="created_at">По дате создания</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-red-600">Ошибка загрузки</h3>
            <p className="text-gray-500 mt-2">Не удалось загрузить магазины. Попробуйте позже.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredStores.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">
              {searchTerm ? "Ничего не найдено" : "Пока нет магазинов"}
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTerm 
                ? "Попробуйте изменить поисковый запрос" 
                : "Магазины появятся здесь, когда продавцы их создадут"
              }
            </p>
          </div>
        )}

        {/* Stores Grid */}
        {!isLoading && !error && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map((store) => (
              <Card key={store.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/stores/${store.id}`}>
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={getMainImageUrl(store)}
                      alt={store.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {store.verified && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        Проверен
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">
                    <Link 
                      to={`/stores/${store.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {store.name}
                    </Link>
                  </CardTitle>
                  
                  {store.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{store.rating.toFixed(1)}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-2">
                  {store.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {store.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{store.address}</span>
                  </div>

                  {store.tags && store.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {store.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {store.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{store.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Stores;
