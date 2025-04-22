import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Badge, Star } from "lucide-react";
import ProductStatusChangeDialog from "./ProductStatusChangeDialog";

export interface ProductProps {
  id: string;
  name: string;
  price: number;
  image: string;
  location: string;
  seller_opt_id?: string;
  seller_rating?: number;
  optid_created?: string;
  rating_seller?: number;
  brand: string;
  model: string;
  seller_name: string;
  seller_id: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  onStatusChange?: () => void;
}

const ProductCard: React.FC<ProductProps> = ({ 
  id, 
  name, 
  price, 
  image, 
  location,
  rating_seller,
  brand,
  model,
  seller_name,
  seller_id,
  status,
  onStatusChange
}) => {
  return (
    <Card className="group rounded-xl border-none shadow-card transition-all duration-300 hover:shadow-elevation hover:-translate-y-1 bg-white flex flex-col h-full animate-scale-in">
      <div className="aspect-square overflow-hidden relative rounded-t-xl">
        <img 
          src={image || "/placeholder.svg"} 
          alt={name} 
          className="h-full w-full object-cover group-hover:scale-105 transition-all duration-500"
        />
      </div>
      <CardContent className="p-4 pb-0 flex-grow">
        <div className="flex flex-row justify-between items-center mb-2">
          <div className="text-xs text-muted-foreground font-medium flex items-center">
            <Badge size={12} className="mr-1 text-secondary" />
            <span>{brand} · {model}</span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <MapPin size={12} className="mr-1" />
            <span>{location}</span>
          </div>
        </div>
        <div className="flex items-start mb-2 gap-1">
          <h3 className="font-semibold text-base text-foreground leading-tight line-clamp-2">{name}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Link 
            to={`/seller/${seller_id}`} 
            className="font-medium truncate max-w-[90px] hover:text-primary hover:underline transition-colors"
          >
            {seller_name}
          </Link>
          {rating_seller !== undefined && (
            <span className="flex items-center ml-1 gap-0.5 bg-yellow-50 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">{rating_seller?.toFixed(1)}</span>
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-3 flex flex-col gap-2">
        <div className="flex items-end justify-between w-full">
          <p className="font-bold text-lg text-primary">{price} $</p>
          <Link to={`/product/${id}`} className="w-auto ml-2">
            <Button 
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
            >
              Подробнее
            </Button>
          </Link>
        </div>
        {status === "active" && onStatusChange && (
          <ProductStatusChangeDialog
            productId={id}
            productName={name}
            onStatusChange={onStatusChange}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
