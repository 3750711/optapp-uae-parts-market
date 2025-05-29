
import React from "react";
import { CommunicationRatingBadge } from "@/components/admin/CommunicationRatingBadge";

interface SellerCommunicationRatingProps {
  communication_ability?: number | null;
}

export const SellerCommunicationRating: React.FC<SellerCommunicationRatingProps> = ({
  communication_ability
}) => {
  if (!communication_ability) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Сложность коммуникации:</span>
      <CommunicationRatingBadge 
        rating={communication_ability} 
        size="md"
      />
    </div>
  );
};
