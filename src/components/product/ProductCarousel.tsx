import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
}

interface ProductCarouselProps {
  images: ProductImage[];
  productTitle: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  className?: string;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  images,
  productTitle,
  cloudinaryPublicId,
  cloudinaryUrl,
  className = ""
}) => {
  if (!images || images.length === 0) {
    return (
      <div className={`aspect-square bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <OptimizedImage
          src="/placeholder.svg"
          alt={productTitle}
          className="w-full h-full object-cover"
          cloudinaryPublicId={cloudinaryPublicId}
          cloudinaryUrl={cloudinaryUrl}
          size="detail"
          priority={true}
        />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`aspect-square bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <OptimizedImage
          src={images[0].url}
          alt={productTitle}
          className="w-full h-full object-cover"
          cloudinaryPublicId={cloudinaryPublicId}
          cloudinaryUrl={cloudinaryUrl}
          size="detail"
          priority={true}
        />
      </div>
    );
  }

  return (
    <Carousel className={`w-full ${className}`}>
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={image.id}>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <OptimizedImage
                src={image.url}
                alt={`${productTitle} - изображение ${index + 1}`}
                className="w-full h-full object-cover"
                cloudinaryPublicId={cloudinaryPublicId}
                cloudinaryUrl={cloudinaryUrl}
                size="detail"
                priority={index === 0}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default ProductCarousel;