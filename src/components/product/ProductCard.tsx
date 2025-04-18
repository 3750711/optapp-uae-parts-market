
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
}

const ProductCard: React.FC<ProductProps> = ({ 
  id, 
  name, 
  price, 
  image, 
  condition, 
  location,
  seller_opt_id,
  seller_rating 
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden">
        <img 
          src={image || "/placeholder.svg"} 
          alt={name} 
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <Badge className="bg-optapp-yellow text-optapp-dark hover:bg-optapp-yellow/90">
            {condition}
          </Badge>
          <span className="text-sm text-gray-500">{location}</span>
        </div>
        
        {/* Seller info */}
        {(seller_opt_id || seller_rating) && (
          <div className="flex items-center space-x-4 mb-2 text-sm">
            {seller_opt_id && (
              <div>
                <span className="text-gray-500">OPT ID: </span>
                <span className="font-medium">{seller_opt_id}</span>
              </div>
            )}
            {seller_rating !== undefined && seller_rating !== null && (
              <div className="flex items-center">
                <div className="flex mr-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(seller_rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs">
                  <span className="font-medium">{seller_rating.toFixed(1)}</span>
                  <span className="text-gray-500">/5</span>
                </span>
              </div>
            )}
          </div>
        )}

        <h3 className="font-medium text-lg truncate">{name}</h3>
        <p className="font-bold text-xl mt-2">{price} AED</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/product/${id}`} className="w-full">
          <Button className="w-full bg-optapp-yellow text-optapp-dark hover:bg-optapp-yellow/80">
            Подробнее
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
