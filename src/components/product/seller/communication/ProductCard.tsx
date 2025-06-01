
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
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-200 shadow-sm mt-2">
        <div className="flex items-start gap-2 mb-2">
          <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <h4 className="font-medium text-gray-900 text-xs line-clamp-2 leading-tight">
            {truncateTitle(productTitle, 50)}
          </h4>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-xs">Лот: {lotNumber || '—'}</span>
          <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-md">
            <DollarSign className="h-3 w-3 text-green-700" />
            <span className="font-bold text-green-800 text-sm">{productPrice}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-200 mt-3">
      <div className="flex items-start gap-2 mb-2">
        <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {productTitle}
        </h4>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">Лот: {lotNumber || '—'}</span>
        <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-md">
          <DollarSign className="h-4 w-4 text-green-700" />
          <span className="font-bold text-green-800 text-lg">{productPrice}</span>
        </div>
      </div>
    </div>
  );
};
