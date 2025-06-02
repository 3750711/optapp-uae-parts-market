
import React from "react";
import { Package, DollarSign } from "lucide-react";

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

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Package className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm leading-tight mb-2">
            {isMobile ? truncateTitle(productTitle, 35) : truncateTitle(productTitle, 50)}
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Лот: {lotNumber || '—'}
            </span>
            <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
              <DollarSign className="h-4 w-4" />
              {productPrice}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
