
import React from "react";
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
        <span className="text-sm text-gray-400 italic">
          не известно, на сколько сложно контактировать с продавцем - собираем информацию
        </span>
      )}
    </div>
  );
};
