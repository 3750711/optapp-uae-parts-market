
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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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

  // Get all available images
  const allImages = [];
  if (product.preview_image) {
    allImages.push(product.preview_image);
  }
  if (product.image && product.image !== product.preview_image) {
    allImages.push(product.image);
  }
  if (product.product_images) {
    product.product_images.forEach(img => {
      if (!allImages.includes(img.url)) {
        allImages.push(img.url);
      }
    });
  }

  const primaryImage = product.preview_image || product.image || "/placeholder.svg";

  const handleImageError = () => {
    setImageError(true);
  };

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    // Debug logging
    api.on("dragStart", () => {
      console.log("Carousel drag started");
      setIsDragging(true);
    });

    api.on("dragEnd", () => {
      console.log("Carousel drag ended");
      setIsDragging(false);
    });
  }, [api]);

  // Prevent link navigation when dragging/swiping
  const handleLinkClick = (e: React.MouseEvent) => {
    if (isDragging) {
      console.log("Preventing link click due to drag");
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Prevent touch events from bubbling to parent Link
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log("Touch start on carousel");
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const renderImageContent = () => {
    if (isMobile && allImages.length > 1) {
      // Mobile carousel with enhanced touch support
      return (
        <div 
          className="w-full h-full touch-pan-x"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-x' }}
        >
          <Carousel 
            className="w-full h-full" 
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
              watchDrag: true,
              skipSnaps: false,
            }}
          >
            <CarouselContent className="h-full">
              {allImages.map((imageUrl, index) => (
                <CarouselItem key={index} className="basis-full h-full">
                  <div className="relative w-full h-full">
                    <img
                      src={imageError ? "/placeholder.svg" : imageUrl}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-contain select-none"
                      onError={handleImageError}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Dots indicator for mobile with improved visibility */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
              {allImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${
                    index === current ? 'bg-white scale-110' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* Visual feedback for swipe capability */}
            {allImages.length > 1 && current === 0 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 animate-pulse">
                <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                  Свайп →
                </div>
              </div>
            )}
          </Carousel>
        </div>
      );
    } else {
      // Desktop single image
      return (
        <img
          src={imageError ? "/placeholder.svg" : primaryImage}
          alt={product.title}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={handleImageError}
          loading="lazy"
        />
      );
    }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200"
      onClick={handleLinkClick}
    >
      <div className="relative">
        <AspectRatio ratio={16 / 9} className="bg-gray-50 overflow-hidden">
          {renderImageContent()}
        </AspectRatio>
        {getStatusBadge(product.status)}
        {product.lot_number && (
          <Badge variant="outline" className="absolute top-2 left-2 text-xs z-20">
            Лот: {product.lot_number}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        
        {(product.brand || product.model) && (
          <p className="text-sm text-gray-600 mb-2">
            {[product.brand, product.model].filter(Boolean).join(' ')}
          </p>
        )}
        
        <div className="flex items-center justify-between">
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
