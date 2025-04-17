
import React from "react";

interface ProductSpecificationsProps {
  brand: string;
  model: string;
  lot_number: string | number;
}

const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ 
  brand, 
  model, 
  lot_number 
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm mb-6">
      <div className="border rounded p-2">
        <div className="text-gray-500">Бренд</div>
        <div className="font-medium">{brand}</div>
      </div>
      <div className="border rounded p-2">
        <div className="text-gray-500">Модель</div>
        <div className="font-medium">{model}</div>
      </div>
      <div className="border rounded p-2">
        <div className="text-gray-500">Номер лота</div>
        <div className="font-medium">{lot_number}</div>
      </div>
    </div>
  );
};

export default ProductSpecifications;
