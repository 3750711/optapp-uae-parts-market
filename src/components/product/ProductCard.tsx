import React, { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Badge as BadgeIcon, Star, Truck, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProductStatusChangeDialog from "./ProductStatusChangeDialog";
import ProductDeleteDialog from "./ProductDeleteDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // Оптимизация: Мемоизируем вычисление отображаемого изображения
  // Use the preview image if available, otherwise fall back to the original image
  const displayImage = useMemo(() => preview_image || image, [preview_image, image]);

  // Оптимизация: Мемоизируем вычисление HotLot статуса
  const isHot = useMemo(() => {
    if (!created_at) return false;
    const createdDate = new Date(created_at);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);
    return diffInMinutes <= 10;
  }, [created_at]);

  // Оптимизация: Мемоизируем статус бейдж
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
      className={`group rounded-xl border-none shadow-card transition-all duration-300 hover:shadow-elevation hover:-translate-y-1 bg-white flex flex-col h-full animate-scale-in ${isMobile ? 'cursor-pointer' : ''}`}
      onClick={isMobile ? handleCardClick : undefined}
    >
      <div className="h-[240px] overflow-hidden relative rounded-t-xl bg-white flex items-center justify-center">
        <img 
          src={displayImage || "/placeholder.svg"} 
          alt={name} 
          className={`max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-500 bg-white ${
            status === 'sold' ? 'opacity-50' : ''
          }`}
          loading="lazy"
          decoding="async"
          fetchPriority={isHot ? "high" : "auto"}
        />
        {status === 'sold' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-destructive/90 text-destructive-foreground font-bold text-3xl py-3 px-6 rotate-[-35deg] w-[150%] text-center shadow-xl">
              SOLD OUT
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <div className="flex gap-2">
            {statusBadge}
            {typeof onStatusChange === "function" && status === "pending" && (
              <ProductDeleteDialog
                productId={id}
                productName={name}
                onDeleted={onStatusChange}
              />
            )}
          </div>
          {isHot && (
            <Badge className="bg-red-500 text-white border-none flex items-center gap-1 mt-2">
              <Flame className="h-3 w-3 fill-white" />
              HOT LOT
            </Badge>
          )}
          {has_preview && (
            <Badge className="bg-green-500 text-white border-none flex items-center gap-1 mt-2">
              Preview
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4 pb-0 flex-grow">
        <div className="flex flex-row justify-between items-center mb-2">
          <div className="text-xs text-muted-foreground font-medium flex items-center">
            <BadgeIcon className="mr-1 text-secondary w-3 h-3" />
            <span>{brand} · {model}</span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <MapPin size={12} className="mr-1" />
            <span>{location}</span>
          </div>
        </div>
        <div className="flex items-start mb-2 gap-1">
          <h3 className="font-semibold text-base text-foreground leading-tight line-clamp-2">{name}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-2">
            <Link 
              to={`/seller/${seller_id}`} 
              className="font-medium truncate max-w-[90px] hover:text-primary hover:underline transition-colors"
            >
              {seller_name}
            </Link>
            {seller_opt_status === 'opt_user' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-[10px] font-medium">
                OPT
              </span>
            )}
          </div>
          {rating_seller !== undefined && (
            <span className="flex items-center ml-1 gap-0.5 bg-yellow-50 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">{rating_seller?.toFixed(1)}</span>
            </span>
          )}
        </div>
        {canViewDeliveryPrice && delivery_price !== null && delivery_price !== undefined && delivery_price > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Truck className="w-3 h-3" />
            <span>Доставка: {delivery_price} $</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-3 flex flex-col gap-2">
        <div className="flex items-end justify-between w-full">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-primary">{price} $</p>
            {canViewDeliveryPrice && delivery_price !== null && delivery_price !== undefined && delivery_price > 0 && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Truck className="w-3 h-3" />
                +{delivery_price} $
              </span>
            )}
          </div>
          {!isMobile && (
            <Link to={`/product/${id}?from_page=${currentPage}`} className="w-auto ml-2">
              <Button 
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10"
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

// Экспортируем компонент как мемоизированный
export default React.memo(ProductCard);
