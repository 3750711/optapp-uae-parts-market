
import React from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface ProductInfoProps {
  title: string;
  price: string | number;
  condition: string;
  location: string;
  description: string;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ 
  title, 
  price, 
  condition, 
  location, 
  description 
}) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Badge className="bg-optapp-yellow text-optapp-dark">{condition}</Badge>
        <span className="text-gray-500 flex items-center">
          <MapPin className="h-4 w-4 mr-1" /> {location || "Не указано"}
        </span>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <div className="text-2xl font-bold text-optapp-dark mb-4">
        {price} AED
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Описание:</h3>
        <p className="text-gray-700">{description || "Описание отсутствует"}</p>
      </div>
    </div>
  );
};

export default ProductInfo;
