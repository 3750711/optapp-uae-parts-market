import React, { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/utils/formatPrice";
import { ProductProps } from "@/components/product/ProductCard";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader2, Image as ImageIcon } from "lucide-react";

interface OptimizedMobileCatalogCardProps {
  product: ProductProps;
  onStatusChange?: (productId: string, newStatus: string) => void;
  showSoldButton?: boolean;
}

const StatusPill = ({ status }: { status: string }) => {
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
};

export const OptimizedMobileCatalogCard = React.memo(({ 
  product,
  onStatusChange,
  showSoldButton 
}: OptimizedMobileCatalogCardProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
        rootMargin: '50px',
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

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  const formatCreatedDate = (createdAt: string | null | undefined) => {
    if (!createdAt) return 'недавно';
    
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return 'недавно';
    
    try {
      return `${formatDistanceToNow(date, { 
        addSuffix: false,
        locale: ru 
      })} назад`;
    } catch {
      return 'недавно';
    }
  };

  // Get ONLY first image for list view
  const firstImage = React.useMemo(() => {
    if (product.product_images?.[0]) {
      const img = product.product_images[0];
      return typeof img === 'object' ? img.url : img;
    }
    return product.cloudinary_url || '/placeholder.svg';
  }, [product.product_images, product.cloudinary_url]);

  // Count additional photos
  const additionalPhotosCount = React.useMemo(() => {
    const totalImages = product.product_images?.length || 0;
    return totalImages > 1 ? totalImages - 1 : 0;
  }, [product.product_images]);

  return (
    <Card 
      ref={cardRef}
      className="bg-transparent border-0 shadow-none cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-2.5 space-y-3 overflow-hidden">
        {/* Image Section - ONLY ONE PHOTO */}
        <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
          {isVisible ? (
            <>
              <img
                src={firstImage}
                alt={product.title}
                className={cn(
                  "w-full h-full object-contain transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/placeholder.svg') {
                    target.src = '/placeholder.svg';
                  }
                  setImageLoaded(true);
                }}
              />
              
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Badge with additional photos count */}
              {additionalPhotosCount > 0 && (
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  +{additionalPhotosCount}
                </div>
              )}
            </>
          ) : (
            // Skeleton loader while card is not in viewport
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
        </div>

        <Separator className="bg-border" />

        {/* Info Block */}
        <div className="px-2.5 space-y-2">
          {/* Title Line - Single line with ellipsis */}
          <h3 className="font-semibold text-[16px] leading-tight line-clamp-1">
            {product.title}
            {(product.brand || product.model) && (
              <span className="text-muted-foreground">
                {' · '}
                {[product.brand, product.model].filter(Boolean).join(' ')}
              </span>
            )}
          </h3>

          {/* Price - Large and Red */}
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
            <span>{formatCreatedDate(product.created_at)}</span>
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
});

OptimizedMobileCatalogCard.displayName = "OptimizedMobileCatalogCard";

export default OptimizedMobileCatalogCard;
