
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const SoldWatermark = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="bg-white/75 px-7 py-2 rounded-2xl font-extrabold text-2xl text-link shadow-lg select-none opacity-80 tracking-widest"
      style={{ letterSpacing: 4 }}>
      ПРОДАНО
    </span>
  </div>
);

const NewBadge = () => (
  <span className="ml-2 inline-flex items-center gap-1 bg-[#FFE158] text-[#181920] text-[10px] px-2 py-0.5 rounded font-semibold shadow-xs">
    Новый
  </span>
);

const ProductCard: React.FC<ProductProps> = ({ 
  id, 
  name, 
  price, 
  image, 
  condition, 
  location,
  rating_seller,
  brand,
  model,
  seller_name,
  status
}) => {
  return (
    <Card className="optapp-card relative group rounded-2xl border-none shadow-card transition-transform duration-200 hover:-translate-y-1 bg-white flex flex-col">
      <div className="aspect-square overflow-hidden relative rounded-xl">
        <img 
          src={image || "/placeholder.svg"} 
          alt={name} 
          className="h-full w-full object-cover rounded-xl group-hover:scale-105 transition-all duration-300"
        />
        {status === 'sold' && <SoldWatermark />}
      </div>
      <CardContent className="p-4 pb-0">
        {/* Верхняя инфо строка */}
        <div className="flex flex-row justify-between items-center mb-1">
          <div className="text-xs text-[#525e77] font-semibold truncate">
            {brand} <span className="text-gray-300">|</span> {model}
          </div>
          <div className="text-xs text-[#9ba2b0]">{location}</div>
        </div>
        {/* Название и новый бейдж */}
        <div className="flex items-center mb-2 gap-1">
          <span className="font-bold text-base text-[#181920] truncate leading-tight">{name}
            {condition === "Новый" && <NewBadge />}
          </span>
        </div>
        {/* Продавец и рейтинг */}
        <div className="flex items-center gap-2 text-xs text-[#47536b] mt-1">
          <span className="font-semibold truncate max-w-[90px]">{seller_name}</span>
          {rating_seller !== undefined && (
            <span className="flex items-center ml-1 gap-0.5">
              <Star className="w-4 h-4 text-[#ffd600] fill-[#ffd600] mr-0.5" />
              <span className="text-xs ml-0.5 font-semibold">{rating_seller?.toFixed(1)}</span>
            </span>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <p className="font-bold text-lg text-link">{price} AED</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <Link to={`/product/${id}`} className="w-full">
          <Button 
            className={"btn-blue w-full rounded-lg"}
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
