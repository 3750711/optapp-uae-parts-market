
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
      <div className="relative overflow-hidden rounded-xl bg-white shadow-lg border border-blue-100/50 p-3">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-6 translate-x-6"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-100/30 to-transparent rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative z-10">
          <div className="flex items-start gap-2 mb-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                {truncateTitle(productTitle, 40)}
              </h4>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="px-2 py-1 bg-gray-100 rounded-md">
              <span className="text-xs text-gray-600 font-medium">Лот: {lotNumber || '—'}</span>
            </div>
            <div className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 px-2 py-1 rounded-lg shadow-sm">
              <DollarSign className="h-3 w-3 text-white" />
              <span className="font-bold text-white text-sm">{productPrice}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-lg border border-blue-100/50 p-4">
      {/* Декоративные элементы */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-100/30 to-transparent rounded-full translate-y-6 -translate-x-6"></div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-base leading-tight">
              {truncateTitle(productTitle, 60)}
            </h4>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-sm text-gray-600 font-medium">Лот: {lotNumber || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 rounded-lg shadow-sm">
            <DollarSign className="h-4 w-4 text-white" />
            <span className="font-bold text-white text-lg">{productPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
