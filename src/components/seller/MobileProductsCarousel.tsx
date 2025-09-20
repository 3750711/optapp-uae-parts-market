import React from 'react';
import { useIsMobileEnhanced } from '@/hooks/use-mobile-enhanced';
import { useLatestPublishedProducts } from '@/hooks/useLatestPublishedProducts';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import CompactProductCard from '@/components/product/CompactProductCard';

const MobileProductsCarousel = () => {
  const { data: products, isLoading } = useLatestPublishedProducts();

  // Don't show if loading or no products
  if (isLoading || !products || products.length === 0) {
    return null;
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
          {limitedProducts.map((product) => {
            // Get primary image or first image
            const primaryImage = product.product_images?.find(img => img.is_primary);
            const imageUrl = primaryImage?.url || product.product_images?.[0]?.url;
            
            return (
              <CarouselItem key={product.id} className="pl-1 basis-[160px] snap-start">
                <CompactProductCard
                  title={product.title}
                  brand={product.brand}
                  model={product.model}
                  imageUrl={imageUrl}
                  telegramStyleV2={true}
                  heightVariant="compact"
                  price={product.price}
                  deliveryPrice={product.delivery_price}
                  lotNumber={product.lot_number}
                  condition={product.condition}
                  description={product.description}
                  sellerOptId={product.profiles?.opt_id}
                  sellerTelegram={product.profiles?.telegram}
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