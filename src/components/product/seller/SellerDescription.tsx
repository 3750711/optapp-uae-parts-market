
import React from "react";

interface SellerDescriptionProps {
  description?: string | null;
}

export const SellerDescription: React.FC<SellerDescriptionProps> = ({
  description
}) => {
  if (!description) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
    </div>
  );
};
