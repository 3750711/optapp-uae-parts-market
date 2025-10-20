import React, { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatPrice } from "@/utils/formatPrice";
import { ProductProps } from "@/components/product/ProductCard";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";

interface MobileCatalogCardProps {
  product: ProductProps;
  onStatusChange?: (productId: string, newStatus: string) => void;
  showSoldButton?: boolean;
}

const StatusPill = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Active' };
      case 'sold':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Sold' };
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Reserved' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-500', label: status };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-medium",
      config.bg,
      config.text
    )}>
      {config.label}
    </span>
  );
};

export const MobileCatalogCard = React.memo(({ 
  product,
  onStatusChange,
  showSoldButton 
}: MobileCatalogCardProps) => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    containScroll: 'trimSnaps'
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  // Prepare images array
  const images = React.useMemo(() => {
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      return product.product_images.map(img => 
        typeof img === 'object' ? img.url : img
      );
    }
    if (product.cloudinary_url) {
      return [product.cloudinary_url];
    }
    return ['/placeholder.svg'];
  }, [product.product_images, product.cloudinary_url]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  return (
    <Card 
      className="overflow-hidden bg-transparent border-0 shadow-none cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-2.5 space-y-3">
        {/* Image Carousel Section */}
        <div className="relative w-full">
          {images.length > 1 ? (
            <>
              <div ref={emblaRef} className="overflow-hidden rounded-lg">
                <div className="flex gap-2">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0">
                      <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                        <OptimizedImage
                          src={imageUrl}
                          alt={`${product.title} - фото ${index + 1}`}
                          className="w-full h-full object-cover"
                          cloudinaryPublicId={product.cloudinary_public_id}
                          cloudinaryUrl={product.cloudinary_url}
                          priority={index === 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dot Indicators */}
              <div className="flex justify-center gap-1.5 mt-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollTo(index);
                    }}
                    className="p-1"
                    aria-label={`Перейти к фото ${index + 1}`}
                  >
                    <span
                      className={cn(
                        "block w-2 h-2 rounded-full transition-colors",
                        index === currentIndex
                          ? "bg-primary"
                          : "bg-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              <OptimizedImage
                src={images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
                cloudinaryPublicId={product.cloudinary_public_id}
                cloudinaryUrl={product.cloudinary_url}
                priority={true}
              />
            </div>
          )}
        </div>

        <Separator className="bg-gray-200" />

        {/* Info Block */}
        <div className="px-2.5 space-y-2">
          {/* Title Line - Single line with ellipsis */}
          <h3 className="font-semibold text-[16px] leading-tight line-clamp-1">
            {product.title}
            {(product.brand || product.model) && (
              <span className="text-gray-600">
                {' · '}
                {[product.brand, product.model].filter(Boolean).join(' ')}
              </span>
            )}
          </h3>

          {/* Price - Large and Red */}
          <div className="text-xl font-bold text-[#e53935]">
            {product.price !== null 
              ? formatPrice(product.price)
              : '🔒 Войдите для просмотра'
            }
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>UAE</span>
            <span className="text-gray-400">·</span>
            <span>
              {formatDistanceToNow(new Date(product.created_at), { 
                addSuffix: false,
                locale: ru 
              })} назад
            </span>
          </div>
        </div>

        {/* Footer Panel */}
        <div className="border-t border-gray-200/50 pt-2 px-2.5 flex items-center justify-between">
          {/* Left: Lot Number */}
          <span className="text-xs font-mono text-gray-600">
            Lot {product.lot_number || '—'}
          </span>
          
          {/* Right: Status Pill */}
          <StatusPill status={product.status} />
        </div>
      </div>
    </Card>
  );
});

MobileCatalogCard.displayName = "MobileCatalogCard";

export default MobileCatalogCard;
