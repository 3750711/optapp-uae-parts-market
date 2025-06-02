
import React from "react";
import { DollarSign, Package } from "lucide-react";

interface ProductCardProps {
  productTitle: string;
  productPrice: number;
  lotNumber?: number | null;
  isMobile?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  productTitle,
  productPrice,
  lotNumber,
  isMobile = false
}) => {
  const truncateTitle = (title: string, maxLength: number) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  if (isMobile) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-card shadow-card border border-border p-3">
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
              {truncateTitle(productTitle, 40)}
            </h4>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="px-2 py-1 bg-muted rounded-md">
            <span className="text-xs text-muted-foreground font-medium">Лот: {lotNumber || '—'}</span>
          </div>
          <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-lg shadow-sm">
            <DollarSign className="h-3 w-3 text-secondary-foreground" />
            <span className="font-bold text-secondary-foreground text-sm">{productPrice}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-card shadow-card border border-border p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Package className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-base leading-tight">
            {truncateTitle(productTitle, 60)}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="px-3 py-1.5 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground font-medium">Лот: {lotNumber || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg shadow-sm">
          <DollarSign className="h-4 w-4 text-secondary-foreground" />
          <span className="font-bold text-secondary-foreground text-lg">{productPrice}</span>
        </div>
      </div>
    </div>
  );
};
