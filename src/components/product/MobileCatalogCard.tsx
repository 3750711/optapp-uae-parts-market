import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatPrice } from "@/utils/formatPrice";
import { ProductProps } from "@/components/product/ProductCard";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  const primaryImage = typeof product.product_images?.[0] === 'object' 
    ? product.product_images[0].url 
    : product.product_images?.[0] || product.cloudinary_url || '/placeholder.svg';

  return (
    <Card 
      className="overflow-hidden bg-white rounded-xl shadow cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="p-2.5 space-y-2.5">
        {/* Image Section */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
          <OptimizedImage
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover"
            cloudinaryPublicId={product.cloudinary_public_id}
            cloudinaryUrl={product.cloudinary_url}
          />
        </div>

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
            {product.product_location && (
              <>
                <span>{product.product_location}</span>
                <span className="text-gray-400">·</span>
              </>
            )}
            <span>
              {formatDistanceToNow(new Date(product.created_at), { 
                addSuffix: false,
                locale: ru 
              })} назад
            </span>
          </div>
        </div>

        {/* Footer Panel */}
        <div className="border-t border-gray-100 pt-2 px-2.5 flex items-center justify-between">
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
