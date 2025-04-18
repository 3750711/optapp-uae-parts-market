import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProductInfoProps {
  id: string;
  seller_id: string;
  title: string;
  price: string | number;
  condition: string;
  location: string;
  description: string;
  rating_seller?: number | null;
  optid_created?: string | null;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ 
  id,
  seller_id,
  title, 
  price, 
  condition, 
  location, 
  description,
  rating_seller,
  optid_created
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user?.id === seller_id;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-optapp-yellow text-optapp-dark">{condition}</Badge>
          <span className="text-gray-500 flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {location || "Не указано"}
          </span>
        </div>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate(`/seller/edit-product/${id}`)}
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </Button>
        )}
      </div>
      
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <div className="text-2xl font-bold text-optapp-dark mb-4">
        {price} AED
      </div>
      
      {(rating_seller !== undefined || optid_created) && (
        <div className="flex items-center space-x-4 mb-4">
          {optid_created && (
            <div>
              <span className="text-gray-500">OPT ID: </span>
              <span className="font-medium">{optid_created}</span>
            </div>
          )}
          {rating_seller !== undefined && rating_seller !== null && (
            <div className="flex items-center">
              <div className="flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(rating_seller)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">
                <span className="font-medium">{rating_seller.toFixed(1)}</span>
                <span className="text-gray-500"> / 5</span>
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Описание:</h3>
        <p className="text-gray-700">{description || "Описание отсутствует"}</p>
      </div>
    </div>
  );
};

export default ProductInfo;
