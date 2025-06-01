
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
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-md p-2 border border-blue-200 shadow-sm mt-2">
        <div className="flex items-start gap-2 mb-1">
          <Package className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
          <h4 className="font-medium text-gray-900 text-xs line-clamp-2 leading-tight">
            {truncateTitle(productTitle, 40)}
          </h4>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-xs">Лот: {lotNumber || '—'}</span>
          <div className="flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded">
            <DollarSign className="h-3 w-3 text-green-700" />
            <span className="font-bold text-green-800 text-sm">{productPrice}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-md p-2 border border-blue-200 mt-2">
      <div className="flex items-start gap-2 mb-1">
        <Package className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {truncateTitle(productTitle, 60)}
        </h4>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">Лот: {lotNumber || '—'}</span>
        <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded">
          <DollarSign className="h-3 w-3 text-green-700" />
          <span className="font-bold text-green-800 text-base">{productPrice}</span>
        </div>
      </div>
    </div>
  );
};
