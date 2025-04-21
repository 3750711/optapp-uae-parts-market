
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export interface ProductProps {
  id: string;
  name: string;
  price: number;
  image: string;
  condition: "Новый" | "Б/У" | "Восстановленный";
  location: string;
  seller_opt_id?: string;
  seller_rating?: number;
  optid_created?: string;
  rating_seller?: number;
  brand: string;
  model: string;
  seller_name: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
}

const ProductCard: React.FC<ProductProps> = ({ 
  id, 
  name, 
  price, 
  image, 
  condition, 
  location,
  seller_opt_id,
  seller_rating,
  optid_created,
  rating_seller,
  brand,
  model,
  seller_name,
  status
}) => {
  // Полупрозрачный watermark для "Продано"
  const SoldWatermark = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-xl font-bold text-2xl text-[#2269f1] opacity-70 shadow-lg select-none" style={{letterSpacing: 2}}>
        ПРОДАНО
      </span>
    </div>
  );

  // Новый бейдж маленький у названия
  const NewBadge = () => (
    <span className="inline-block align-middle ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-semibold">
      Новый
    </span>
  );

  return (
    <Card className="optapp-card relative group overflow-hidden rounded-xl border-none shadow-card transition-transform duration-200 hover:-translate-y-1 bg-white">
      <div className="aspect-square overflow-hidden relative rounded-xl">
        <img 
          src={image || "/placeholder.svg"} 
          alt={name} 
          className={"h-full w-full object-cover rounded-xl group-hover:scale-105 transition-all duration-300"}
        />
        {status === 'sold' && <SoldWatermark />}
      </div>
      <CardContent className="p-4 pb-0">
        <div className="text-xs flex flex-row justify-between items-center mb-1 text-gray-500">
          <span>
            <span className="font-semibold text-[#181920]">{brand}</span>
            {" • "}
            <span>{model}</span>
          </span>
          <span>{location}</span>
        </div>
        <div className="flex items-center mb-2 gap-2">
          <span className="font-semibold text-base text-[#181920] truncate leading-tight">{name}
            {condition === "Новый" && <NewBadge />}
          </span>
        </div>
        {/* Группа: продавец и рейтинг */}
        <div className="flex items-center mt-1 gap-1 text-xs text-gray-500 justify-between">
          <span className="flex-1 min-w-0">
            <span className="font-semibold truncate">{seller_name}</span>
          </span>
          {rating_seller !== undefined && (
            <span className="flex items-center ml-1 gap-0.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-0.5" />
              <span className="text-xs ml-0.5 font-medium">{rating_seller?.toFixed(1)}</span>
            </span>
          )}
        </div>
        <p className="font-bold text-xl text-[#2269f1] mt-2">{price} AED</p>
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <Link to={`/product/${id}`} className="w-full">
          <Button 
            className={"btn-accent w-full rounded-md"}
            size="sm"
          >
            Подробнее
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
