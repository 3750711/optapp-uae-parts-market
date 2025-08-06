import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { SimpleProductCard } from '@/components/product/SimpleProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export const FavoritesSection: React.FC = () => {
  const { favorites, isLoading: favoritesLoading } = useFavorites();

  const { data: favoriteProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['favorite-products', favorites],
    queryFn: async () => {
      if (!favorites || favorites.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, price, brand, model, condition, seller_name, 
          seller_id, status, created_at, lot_number, delivery_price,
          product_images(url, is_primary)
        `)
        .in('id', favorites.slice(0, 4))
        .in('status', ['active', 'sold']);

      if (error) throw error;
      return data || [];
    },
    enabled: !!favorites && favorites.length > 0,
    staleTime: 2 * 60 * 1000
  });

  const isLoading = favoritesLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Избранное
          </h3>
          <Skeleton className="h-4 w-20" />
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                <div className="space-y-2">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  if (!favoriteProducts || favoriteProducts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Избранное
          </h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>У вас пока нет избранных товаров</p>
          <Link 
            to="/catalog" 
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Найти товары
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Избранное
        </h3>
        <Link 
          to="/favorites" 
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Посмотреть все ({favorites?.length || 0}) →
        </Link>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {favoriteProducts.map((product) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
              <SimpleProductCard product={{
                ...product,
                seller_name: product.seller_name || 'Unknown Seller'
              }} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};