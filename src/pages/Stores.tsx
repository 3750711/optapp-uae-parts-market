
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Star, Store, Package, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreWithImages } from '@/types/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StoreWithProductCount extends StoreWithImages {
  product_count?: number;
}

const Stores: React.FC = () => {
  const { profile } = useAuth();
  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      // First fetch the stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(*)
        `)
        .order('created_at', { ascending: false });
      
      if (storesError) throw storesError;
      
      if (!storesData) return [] as StoreWithProductCount[];
      
      // Now get the product counts for each store
      const storesWithCounts = await Promise.all(
        storesData.map(async (store) => {
          const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', store.seller_id);
            
          return {
            ...store,
            product_count: error ? 0 : (count || 0)
          };
        })
      );
      
      return storesWithCounts as StoreWithProductCount[];
    }
  });

  const getMainImageUrl = (store: StoreWithProductCount) => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Магазины</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stores?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">Пока нет магазинов</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores?.map((store) => (
              <Card key={store.id} className="overflow-hidden h-full flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={getMainImageUrl(store)}
                    alt={store.name}
                    className="object-cover w-full h-full transition-transform hover:scale-105"
                  />
                  {/* Display verification status badge prominently */}
                  <div className="absolute top-2 right-2">
                    {store.verified ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Проверено
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 bg-white/80">
                        Не проверено
                      </Badge>
                    )}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link to={`/stores/${store.id}`} className="hover:text-primary">
                        {store.name}
                      </Link>
                      {store.verified && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <ShieldCheck className="w-4 h-4 text-green-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Проверенный магазин</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span>{store.rating?.toFixed(1) || '-'}</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{store.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 flex-grow">
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Package className="w-4 h-4 mr-1 text-muted-foreground" />
                    <span>{store.product_count} объявлений</span>
                  </div>
                  {store.tags && store.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {store.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/stores/${store.id}`}>Подробнее</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Stores;
