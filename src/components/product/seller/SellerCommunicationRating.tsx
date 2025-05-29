
import React from "react";
import { Info } from "lucide-react";
import { CommunicationRatingBadge } from "@/components/admin/CommunicationRatingBadge";

interface SellerCommunicationRatingProps {
  communication_ability?: number | null;
}

export const SellerCommunicationRating: React.FC<SellerCommunicationRatingProps> = ({
  communication_ability
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Сложность коммуникации:</span>
      {communication_ability ? (
        <CommunicationRatingBadge 
          rating={communication_ability} 
          size="md"
        />
      ) : (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 rounded-md">
          <Info className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs text-blue-700 font-medium">
            Собираем отзывы
          </span>
        </div>
      )}
    </div>
  );
};
