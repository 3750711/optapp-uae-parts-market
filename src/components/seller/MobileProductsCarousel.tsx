import React from 'react';
import { useLatestPublishedProducts } from '@/hooks/useLatestPublishedProducts';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import CompactProductCard from '@/components/product/CompactProductCard';
import { CompactProductCardSkeleton } from '@/components/ui/SkeletonLoader';
import { AlertCircle } from 'lucide-react';

// Error component
const ErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="h-10 w-10 text-destructive mb-3" />
    <p className="text-sm text-muted-foreground mb-3">
      Не удалось загрузить товары
    </p>
    <button
      onClick={onRetry}
      className="text-sm text-primary hover:underline"
    >
      Попробовать снова
    </button>
  </div>
);

const MobileProductsCarousel = () => {
  const { data: products, isLoading, error, refetch } = useLatestPublishedProducts();

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex-shrink-0">
            <CompactProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Нет опубликованных товаров
        </p>
      </div>
    );
  }

  // Limit to maximum 10 products
  const limitedProducts = products.slice(0, 10);

  return (
    <div className="overflow-x-auto snap-x snap-mandatory">
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-1 gap-3">
          {limitedProducts.map((product, index) => {
            // Get primary image or first image
            const primaryImage = product.product_images?.find(img => img.is_primary);
            const imageUrl = primaryImage?.url || product.product_images?.[0]?.url;
            
            return (
              <CarouselItem 
                key={product.id} 
                className="pl-1 basis-[160px] snap-start"
              >
                <CompactProductCard
                    title={product.title}
                    brand={product.brand}
                    model={product.model}
                    imageUrl={imageUrl}
                    telegramStyleV2={true}
                    heightVariant="compact"
                    deliveryPrice={product.delivery_price}
                    lotNumber={product.lot_number}
                    condition={product.condition}
                    description={product.description}
                    tgViewsEstimate={product.tg_views_estimate}
                  />
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default MobileProductsCarousel;