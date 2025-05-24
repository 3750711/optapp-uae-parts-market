
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  CarouselApi 
} from "@/components/ui/carousel";
import OptimizedImage from "@/components/ui/OptimizedImage";

export interface ProductProps {
  id: string;
  title: string;
  price: number;
  preview_image?: string;
  image?: string;
  brand?: string;
  model?: string;
  description?: string;
  optid_created?: string;
  seller_id?: string;
  seller_name?: string;
  lot_number?: number;
  status?: 'active' | 'sold' | 'pending' | 'archived';
  delivery_price?: number;
  product_images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
  }>;
}

const ProductCard: React.FC<{ product: ProductProps }> = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const isMobile = useIsMobile();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'sold':
        return <Badge variant="destructive" className="absolute top-2 right-2 z-10">Продано</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="absolute top-2 right-2 z-10 bg-yellow-100 text-yellow-800">На проверке</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="absolute top-2 right-2 z-10 bg-gray-100 text-gray-800">В архиве</Badge>;
      default:
        return null;
    }
  };

  // Get all available images with better fallback logic
  const allImages = [];
  if (product.preview_image && !imageError) {
    allImages.push(product.preview_image);
  }
  if (product.image && product.image !== product.preview_image && !imageError) {
    allImages.push(product.image);
  }
  if (product.product_images && !imageError) {
    product.product_images.forEach(img => {
      if (!allImages.includes(img.url)) {
        allImages.push(img.url);
      }
    });
  }

  // Fallback to placeholder if no images or error
  const primaryImage = allImages.length > 0 ? allImages[0] : "/placeholder.svg";

  const handleImageError = () => {
    console.log(`Image error for product ${product.id}`);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const renderImageContent = () => {
    if (isMobile && allImages.length > 1) {
      // Mobile carousel with touch support for multiple images
      return (
        <Carousel 
          className="w-full" 
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
        >
          <CarouselContent>
            {allImages.map((imageUrl, index) => (
              <CarouselItem key={index} className="basis-full">
                <div className="relative w-full h-full">
                  <OptimizedImage
                    src={imageUrl}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-contain"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Dots indicator for mobile */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {allImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    index === current ? 'bg-white' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </Carousel>
      );
    } else {
      // Desktop single image with loading state
      return (
        <div className="relative w-full h-full">
          <OptimizedImage
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            onLoad={handleImageLoad}
            priority={false}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {imageLoading && !imageError && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 w-full h-full flex flex-col"
    >
      <div className="relative flex-shrink-0">
        <AspectRatio ratio={16 / 9} className="bg-gray-50">
          {renderImageContent()}
        </AspectRatio>
        {getStatusBadge(product.status)}
        {product.lot_number && (
          <Badge variant="outline" className="absolute top-2 left-2 text-xs">
            Лот: {product.lot_number}
          </Badge>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors flex-grow">
          {product.title}
        </h3>
        
        {(product.brand || product.model) && (
          <p className="text-sm text-gray-600 mb-2">
            {[product.brand, product.model].filter(Boolean).join(' ')}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)} ₽
          </span>
          
          {product.seller_name && (
            <span className="text-xs text-gray-500 truncate ml-2">
              {product.seller_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
