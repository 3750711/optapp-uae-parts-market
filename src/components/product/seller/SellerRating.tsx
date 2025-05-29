
import React from "react";
import { Star } from "lucide-react";

interface SellerRatingProps {
  rating?: number | null;
}

export const SellerRating: React.FC<SellerRatingProps> = ({
  rating
}) => {
  if (rating === null || rating === undefined) return null;

  return (
    <div className="flex items-center">
      <div className="flex mr-2">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${
              i < Math.floor(rating || 0) 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`} 
          />
        ))}
      </div>
      <span className="text-sm">
        <span className="font-medium">{rating?.toFixed(1)}</span>
        <span className="text-gray-500"> / 5</span>
      </span>
    </div>
  );
};
