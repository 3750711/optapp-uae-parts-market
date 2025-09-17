import React from 'react';
import { useIsMobileEnhanced } from '@/hooks/use-mobile-enhanced';
import { useLatestPublishedProducts } from '@/hooks/useLatestPublishedProducts';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import CompactProductCard from '@/components/product/CompactProductCard';

const MobileProductsCarousel = () => {
  const isMobile = useIsMobileEnhanced();
  const { data: products, isLoading } = useLatestPublishedProducts();

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  // Don't show if loading or no products
  if (isLoading || !products || products.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-foreground">
        Последние товары
      </h3>
      
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-1">
          {products.map((product) => {
            // Get primary image or first image
            const primaryImage = product.product_images?.find(img => img.is_primary);
            const imageUrl = primaryImage?.url || product.product_images?.[0]?.url;
            
            return (
              <CarouselItem key={product.id} className="pl-1 basis-[120px]">
                <CompactProductCard
                  title={product.title}
                  brand={product.brand}
                  model={product.model}
                  imageUrl={imageUrl}
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