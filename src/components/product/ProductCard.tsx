import React, { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Badge as BadgeIcon, Star, Truck, Flame, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductStatusChangeDialog from "./ProductStatusChangeDialog";
import ProductDeleteDialog from "./ProductDeleteDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { format } from "date-fns";

export interface ProductProps {
  id: string;
  name: string;
  price: number;
  image: string;
  preview_image?: string; // Preview image for catalog display
  location: string;
  seller_opt_id?: string;
  seller_rating?: number;
  optid_created?: string;
  rating_seller?: number;
  brand: string;
  model: string;
  seller_name: string;
  seller_id: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  seller_verification?: 'pending' | 'verified' | 'blocked';
  created_at?: string;
  seller_opt_status?: 'free_user' | 'opt_user';
  onStatusChange?: () => void;
  delivery_price?: number;
  has_preview?: boolean; // Flag indicating if product has preview images
}

const ProductCard: React.FC<ProductProps> = ({ 
  id, 
  name, 
  price, 
  image,
  preview_image, // Use preview image when available
  location,
  rating_seller,
  brand,
  model,
  seller_name,
  seller_id,
  status,
  seller_verification,
  created_at,
  seller_opt_status,
  onStatusChange,
  delivery_price,
  has_preview
}) => {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const currentPage = searchParams.get("page") || "1";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const canViewDeliveryPrice = user && profile?.opt_status === 'opt_user';

  // Optimize: Memoize display image calculation
  const displayImage = useMemo(() => preview_image || image, [preview_image, image]);

  // Determine if this product is using a preview image
  const isUsingPreviewImage = useMemo(() => Boolean(preview_image), [preview_image]);

  // Format creation date
  const formattedCreationDate = useMemo(() => {
    if (!created_at) return null;
    return format(new Date(created_at), 'dd.MM.yyyy');
  }, [created_at]);

  // Optimize: Memoize hot lot status calculation
  const isHot = useMemo(() => {
    if (!created_at) return false;
    const createdDate = new Date(created_at);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);
    return diffInMinutes <= 10;
  }, [created_at]);

  // Optimize: Memoize status badge
  const statusBadge = useMemo(() => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">На проверке</Badge>;
      case 'active':
        return <Badge variant="success">Активный</Badge>;
      case 'sold':
        return <Badge variant="info">Продан</Badge>;
      case 'archived':
        return <Badge variant="outline">В архиве</Badge>;
      default:
        return null;
    }
  }, [status]);

  // Format product title with brand and model
  const formattedTitle = useMemo(() => {
    if (!brand && !model) return name;
    const brandModel = [brand, model].filter(Boolean).join(' • ');
    return `${brandModel} - ${name}`;
  }, [brand, model, name]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on status change dialog or delete dialog or seller link
    if (e.target instanceof Element) {
      const targetElement = e.target as Element;
      
      // Check if click is on or inside a button, link or dialog
      const isClickableElement = 
        targetElement.closest('button') || 
        targetElement.closest('a') || 
        targetElement.closest('[role="dialog"]');
      
      if (isClickableElement) {
        return;
      }
      
      // Navigate to product details
      navigate(`/product/${id}?from_page=${currentPage}`);
    }
  };

  return (
    <Card 
      className="group rounded-xl border-none shadow-card hover:shadow-elevation hover:-translate-y-1 bg-white flex flex-col h-full animate-scale-in"
      onClick={isMobile ? handleCardClick : undefined}
    >
      <div className="overflow-hidden relative rounded-t-xl">
        <AspectRatio ratio={1/1} className="bg-white flex items-center justify-center p-2">
          <img 
            src={displayImage || "/placeholder.svg"} 
            alt={name} 
            className={`max-h-full max-w-full object-contain ${
              status === 'sold' ? 'opacity-50' : ''
            }`}
            loading="lazy"
            decoding="async"
            // Исправляем проблему с атрибутом importance
            // Атрибут importance не поддерживается в типах React для <img>
            // Используем priority вместо importance для изображений
            {...(isHot ? { fetchPriority: "high" as const } : {})}
          />
          {status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-destructive/90 text-destructive-foreground font-bold text-3xl py-3 px-6 rotate-[-35deg] w-[150%] text-center shadow-xl">
                SOLD OUT
              </div>
            </div>
          )}
        </AspectRatio>
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {statusBadge}
          {typeof onStatusChange === "function" && status === "pending" && (
            <ProductDeleteDialog
              productId={id}
              productName={name}
              onDeleted={onStatusChange}
            />
          )}
          {isHot && (
            <Badge className="bg-red-500 text-white border-none flex items-center gap-1">
              <Flame className="h-3 w-3 fill-white" />
              HOT
            </Badge>
          )}
          {has_preview && (
            <Badge className="bg-green-500 text-white border-none flex items-center gap-1">
              Preview
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-3 pb-0 flex-grow">
        <div className="flex flex-row justify-between items-center mb-1">
          <div className="text-xs text-muted-foreground flex items-center">
            <MapPin size={12} className="mr-1" />
            <span className="truncate max-w-[80px]">{location}</span>
          </div>
          
          {rating_seller !== undefined && (
            <span className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">{rating_seller?.toFixed(1)}</span>
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 mb-1">{formattedTitle}</h3>
        
        <div className="flex items-center gap-1 mb-1">
          <Link 
            to={`/seller/${seller_id}`} 
            className="font-medium truncate max-w-[80px] hover:text-primary hover:underline transition-colors text-xs"
          >
            {seller_name}
          </Link>
          {seller_opt_status === 'opt_user' && (
            <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded-md text-[10px] font-medium">
              OPT
            </span>
          )}
        </div>

        {formattedCreationDate && (
          <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formattedCreationDate}</span>
          </div>
        )}
        
        {canViewDeliveryPrice && delivery_price !== null && delivery_price !== undefined && delivery_price > 0 && (
          <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
            <Truck className="w-3 h-3" />
            <span>Доставка: {delivery_price} $</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-2 flex flex-col gap-1">
        <div className="flex items-end justify-between w-full">
          <p className="font-bold text-base text-primary">{price} $</p>
          
          {!isMobile && (
            <Link to={`/product/${id}?from_page=${currentPage}`} className="w-auto">
              <Button 
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10 h-7 text-xs"
              >
                Подробнее
              </Button>
            </Link>
          )}
        </div>
        
        {status === "active" && onStatusChange && (
          <ProductStatusChangeDialog
            productId={id}
            productName={name}
            onStatusChange={onStatusChange}
          />
        )}
      </CardFooter>
    </Card>
  );
};

// Export component as memoized to prevent unnecessary re-renders
export default React.memo(ProductCard);
