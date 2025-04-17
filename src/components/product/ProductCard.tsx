
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ProductProps {
  id: string;
  name: string;
  price: number;
  image: string;
  condition: "Новый" | "Б/У" | "Восстановленный";
  location: string;
}

const ProductCard: React.FC<ProductProps> = ({ id, name, price, image, condition, location }) => {
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
