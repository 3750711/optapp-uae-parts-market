
import React from "react";

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
      <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
        <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">
          {truncateTitle(productTitle, 80)}
        </h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Лот: {lotNumber || '—'}</span>
          <span className="font-semibold text-primary text-base">{productPrice} $</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="font-medium text-gray-900 text-base mb-3 leading-tight">
        {productTitle}
      </h4>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Лот: {lotNumber || '—'}</span>
        <span className="font-semibold text-primary text-lg">{productPrice} $</span>
      </div>
    </div>
  );
};
