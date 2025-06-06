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
import ProductStatusChangeDialog from "@/components/product/ProductStatusChangeDialog";

export interface ProductProps {
  id: string;
  title: string;
  price: number;
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
  preview_image_url?: string | null;
  cloudinary_public_id?: string | null;
  cloudinary_url?: string | null;
  product_images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
  }>;
}

interface ProductCardProps {
  product: ProductProps;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showSoldButton = false, 
  onStatusChange 
}) => {
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

  // Get images with Cloudinary support
  const images = React.useMemo(() => {
    const productImages = product.product_images || [];
    
    if (productImages.length > 0) {
      return productImages
        .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
        .map(img => img.url);
    }
    
    if (product.image) {
      return [product.image];
    }
    
    return ["/placeholder.svg"];
  }, [product.product_images, product.image]);

  // Use preview_image_url as primary source for catalog display
  const catalogImage = React.useMemo(() => {
    // Priority: preview_image_url (optimized for catalog ~20-25KB)
    if (product.preview_image_url) {
      return product.preview_image_url;
    }
    
    // Fallback to primary image or first image
    const primaryImageData = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
    return primaryImageData?.url || 
           product.image || 
           "/placeholder.svg";
  }, [product.preview_image_url, product.product_images, product.image]);

  const handleImageError = () => {
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
    if (isMobile && images.length > 1) {
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
            {images.map((imageUrl, index) => (
              <CarouselItem key={index} className="basis-full">
                <OptimizedImage
                  src={index === 0 ? catalogImage : imageUrl}
                  alt={`${product.title} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  cloudinaryPublicId={index === 0 && product.cloudinary_public_id ? product.cloudinary_public_id : undefined}
                  size="card"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {images.map((_, index) => (
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
      return (
        <OptimizedImage
          src={catalogImage}
          alt={product.title}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105 object-cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
          priority={false}
          sizes="(max-width: 768px) 50vw, 25vw"
          cloudinaryPublicId={product.cloudinary_public_id || undefined}
          size="card"
        />
      );
    }
  };

  return (
    <div className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 w-full h-full flex flex-col">
      <Link
        to={`/product/${product.id}`}
        className="flex-1 flex flex-col"
      >
        <div className="relative flex-shrink-0">
          <AspectRatio ratio={16 / 9} className="bg-gray-50">
            {renderImageContent()}
          </AspectRatio>
          {getStatusBadge(product.status)}
          {product.lot_number && (
            <Badge 
              variant="outline" 
              className="absolute top-2 left-2 text-xs bg-white/95 text-gray-800 border-gray-300 backdrop-blur-sm font-medium shadow-sm"
            >
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
              {formatPrice(product.price)} $
            </span>
            
            {product.seller_name && (
              <span className="text-xs text-gray-500 truncate ml-2">
                {product.seller_name}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {showSoldButton && product.status === 'active' && (
        <div className="p-4 pt-0">
          <ProductStatusChangeDialog
            productId={product.id}
            productName={product.title}
            onStatusChange={onStatusChange || (() => {})}
          />
        </div>
      )}
    </div>
  );
};

export default ProductCard;
