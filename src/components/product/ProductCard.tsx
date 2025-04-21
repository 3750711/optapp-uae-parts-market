
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
  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border border-yellow-300">Ожидает проверки</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-green-50 text-green-700 border border-green-300">Опубликован</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-300">Продан</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Архив</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden bg-white border border-[#f3f414] hover:shadow-xl shadow transition-shadow">
      <div className="aspect-square overflow-hidden relative">
        <img 
          src={image || "/placeholder.svg"} 
          alt={name} 
          className={`h-full w-full object-cover transition-transform hover:scale-105 ${status === 'sold' ? 'opacity-70' : ''}`}
        />
        {status === 'sold' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#f3f414] text-black px-4 py-2 rounded-lg font-bold transform rotate-45 shadow-xl text-lg border border-black">
              ПРОДАНО
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <Badge className="bg-[#f3f414] text-black hover:bg-[#f3f414]/90 border border-black font-bold">
            {condition}
          </Badge>
          <span className="text-sm text-black">{location}</span>
        </div>
        
        {getStatusBadge()}
        
        {/* Brand and Model info */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Бренд:</span> {brand}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Модель:</span> {model}
          </div>
        </div>
        
        {/* Seller info */}
        <div className="flex flex-col space-y-2 mb-2 text-sm">
          <div className="text-gray-700">
            <span className="font-medium">Продавец:</span> {seller_name}
          </div>
          <div className="flex items-center space-x-4">
            {(optid_created || seller_opt_id) && (
              <div>
                <span className="text-gray-500">OPT ID: </span>
                <span className="font-medium">{optid_created || seller_opt_id}</span>
              </div>
            )}
            {(rating_seller !== undefined && rating_seller !== null) && (
              <div className="flex items-center">
                <div className="flex mr-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(rating_seller)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs">
                  <span className="font-medium">{rating_seller?.toFixed(1)}</span>
                  <span className="text-gray-500">/5</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <h3 className="font-medium text-lg truncate text-black">{name}</h3>
        <p className="font-bold text-xl mt-2 text-black">{price} AED</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/product/${id}`} className="w-full">
          <Button 
            className={`w-full ${
              status === 'sold' 
              ? 'bg-gray-400 hover:bg-gray-500 text-white' 
              : 'bg-[#f3f414] text-black hover:bg-yellow-300 border border-black font-bold'
            }`}
          >
            {status === 'sold' ? 'Просмотреть' : 'Подробнее'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
