import React from 'react';
import { Link } from 'react-router-dom';
import { useOptimizedCatalogProducts } from '@/hooks/useOptimizedCatalogProducts';
import { SimpleProductCard } from '@/components/product/SimpleProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export const LatestProductsSection: React.FC = () => {
  const { mappedProducts, isLoading } = useOptimizedCatalogProducts({
    productsPerPage: 6,
    sortBy: 'newest'
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Последние товары</h3>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const latestProducts = mappedProducts.slice(0, 6);

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {latestProducts.map((product) => (
          <SimpleProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};