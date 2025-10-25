import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/utils/formatPrice";
import { ProductProps } from "@/components/product/ProductCard";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';

interface ProductImage {
  url: string;
  id?: string;
  is_primary?: boolean;
}

interface OptimizedMobileCatalogCardProps {
  product: ProductProps;
  onStatusChange?: (productId: string, newStatus: string) => void;
  showSoldButton?: boolean;
}

const StatusPill = React.memo(({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-muted', text: 'text-foreground', label: 'Active' };
      case 'sold':
        return { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Sold' };
      case 'pending':
        return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Reserved' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', label: status };
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
});

StatusPill.displayName = "StatusPill";

export const OptimizedMobileCatalogCard = React.memo(({ 
  product,
  onStatusChange,
  showSoldButton 
}: OptimizedMobileCatalogCardProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  // Get all images
  const images = useMemo(() => {
    const imageList: string[] = [];
    
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      product.product_images.forEach((img: ProductImage | string) => {
        const url = typeof img === 'object' ? img.url : img;
        if (url) imageList.push(url);
      });
    }
    
    if (imageList.length === 0 && product.cloudinary_url) {
      imageList.push(product.cloudinary_url);
    }
    
    if (imageList.length === 0) {
      imageList.push('/placeholder.svg');
    }
    
    return imageList;
  }, [product.product_images, product.cloudinary_url]);
  
  const shouldUseCarousel = isVisible && images.length > 1;
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    shouldUseCarousel 
      ? { loop: false, align: 'center', containScroll: 'trimSnaps' }
      : { watchDrag: false, active: false }
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Initialize loading state incrementally (avoid resetting already loaded images)
  useEffect(() => {
    if (isVisible) {
      setImageLoading(prev => {
        const newLoading = { ...prev };
        images.forEach((_, idx) => {
          if (!(idx in newLoading)) {
            newLoading[idx] = true;
          }
        });
        return newLoading;
      });
    }
  }, [isVisible, images.length]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading earlier for smoother experience
        threshold: 0.01
      }
    );

    const currentCard = cardRef.current;
    if (currentCard) {
      observer.observe(currentCard);
    }

    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
      observer.disconnect();
    };
  }, []);

  const handleClick = useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const handleImageLoad = useCallback((index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>, index: number) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== '/placeholder.svg') {
      target.src = '/placeholder.svg';
    }
    setImageLoading(prev => ({ ...prev, [index]: false }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!emblaApi) return;
    
    if (e.key === 'ArrowLeft') {
      e.stopPropagation();
      emblaApi.scrollPrev();
    } else if (e.key === 'ArrowRight') {
      e.stopPropagation();
      emblaApi.scrollNext();
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const handleSelect = () => {
      if (emblaApi) {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      }
    };
    
    emblaApi.on('select', handleSelect);
    emblaApi.on('reInit', handleSelect);
    
    // Call immediately to set initial state
    handleSelect();
    
    return () => {
      try {
        emblaApi?.off('select', handleSelect);
        emblaApi?.off('reInit', handleSelect);
      } catch (e) {
        // Embla already destroyed, ignore
        console.debug('Embla cleanup: already destroyed');
      }
    };
  }, [emblaApi]);

  const formattedDate = useMemo(() => {
    if (!product.created_at) return 'недавно';
    
    const date = new Date(product.created_at);
    if (isNaN(date.getTime())) return 'недавно';
    
    try {
      return `${formatDistanceToNow(date, { 
        addSuffix: false,
        locale: ru 
      })} назад`;
    } catch {
      return 'недавно';
    }
  }, [product.created_at]);

  return (
    <Card 
      ref={cardRef}
      className="bg-transparent border-0 shadow-none cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-2.5 space-y-3 overflow-hidden">
        {/* Image Carousel Section */}
        <div className="relative w-full">
          {isVisible ? (
            images.length > 1 ? (
              <>
                <div 
                  ref={emblaRef} 
                  className="overflow-hidden rounded-lg" 
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                  tabIndex={0}
                  role="region"
                  aria-label={`Галерея изображений для ${product.title}`}
                  aria-roledescription="carousel"
                >
                  <div className="flex h-[240px] sm:h-[280px]">
                    {images.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className="relative flex-[0_0_100%] min-w-0 bg-muted"
                      >
                        <img
                          src={imageUrl}
                          alt={`${product.title} - изображение ${index + 1}`}
                          className={cn(
                            "w-full h-full object-contain transition-opacity duration-300",
                            imageLoading[index] ? "opacity-0" : "opacity-100"
                          )}
                          loading="lazy"
                          onLoad={() => handleImageLoad(index)}
                          onError={(e) => handleImageError(e, index)}
                        />
                        
                        {imageLoading[index] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dots Indicator */}
                <div className="flex justify-center gap-1.5 mt-2.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        emblaApi?.scrollTo(index);
                      }}
                      className={cn(
                        "h-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        index === selectedIndex 
                          ? "w-6 bg-primary" 
                          : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                      aria-label={`Перейти к изображению ${index + 1} из ${images.length}`}
                      aria-current={index === selectedIndex ? "true" : "false"}
                    />
                  ))}
                </div>
              </>
            ) : (
              // Single image
              <div className="relative h-[240px] sm:h-[280px] bg-muted rounded-lg overflow-hidden">
                <img
                  src={images[0]}
                  alt={product.title}
                  className={cn(
                    "w-full h-full object-contain transition-opacity duration-300",
                    imageLoading[0] ? "opacity-0" : "opacity-100"
                  )}
                  loading="lazy"
                  onLoad={() => handleImageLoad(0)}
                  onError={(e) => handleImageError(e, 0)}
                />
                
                {imageLoading[0] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            )
          ) : (
            // Skeleton loader while card is not in viewport
            <div className="h-[240px] sm:h-[280px] bg-muted rounded-lg animate-pulse" />
          )}
        </div>

        <Separator className="bg-border" />

        {/* Info Block */}
        <div className="px-2.5 space-y-2">
          {/* Title Line */}
          <h3 className="font-semibold text-[16px] leading-tight line-clamp-1">
            {product.title}
            {(product.brand || product.model) && (
              <span className="text-muted-foreground">
                {' · '}
                {[product.brand, product.model].filter(Boolean).join(' ')}
              </span>
            )}
          </h3>

          {/* Price */}
          <div className="text-xl font-bold text-destructive">
            {product.price !== null 
              ? formatPrice(product.price)
              : '🔒 Войдите для просмотра'
            }
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>UAE</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Footer Panel */}
        <div className="border-t border-border/50 pt-2 px-2.5 flex items-center justify-between">
          {/* Left: Lot Number */}
          <span className="text-xs font-mono text-muted-foreground">
            Lot {product.lot_number || '—'}
          </span>
          
          {/* Right: Status Pill */}
          <StatusPill status={product.status} />
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Optimize re-renders
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.status === nextProps.product.status &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.title === nextProps.product.title &&
    prevProps.product.cloudinary_url === nextProps.product.cloudinary_url &&
    prevProps.product.created_at === nextProps.product.created_at &&
    prevProps.product.product_images?.length === nextProps.product.product_images?.length
  );
});

OptimizedMobileCatalogCard.displayName = "OptimizedMobileCatalogCard";

export default OptimizedMobileCatalogCard;
