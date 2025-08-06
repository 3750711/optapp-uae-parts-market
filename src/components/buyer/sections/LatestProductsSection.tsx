import React from 'react';
import { Link } from 'react-router-dom';
import { useOptimizedCatalogProducts } from '@/hooks/useOptimizedCatalogProducts';
import { SimpleProductCard } from '@/components/product/SimpleProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export const LatestProductsSection: React.FC = () => {
  const { mappedProducts, isLoading } = useOptimizedCatalogProducts({
    productsPerPage: 12,
    sortBy: 'newest'
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Последние товары</h3>
          <Skeleton className="h-4 w-20" />
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {Array.from({ length: 6 }).map((_, i) => (
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

  const latestProducts = mappedProducts.slice(0, 12);

  if (latestProducts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Последние товары</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет доступных товаров</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Последние товары</h3>
        <Link 
          to="/catalog" 
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Посмотреть все →
        </Link>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {latestProducts.map((product) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
              <SimpleProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};