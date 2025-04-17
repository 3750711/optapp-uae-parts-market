
import React from "react";
import { ShieldCheck, CircleDollarSign } from "lucide-react";

interface SellerProfileType {
  full_name?: string;
  rating?: number;
  opt_id?: string;
}

interface SellerInfoProps {
  sellerProfile: SellerProfileType;
  seller_name: string;
  children?: React.ReactNode;
}

const SellerInfo: React.FC<SellerInfoProps> = ({ 
  sellerProfile, 
  seller_name, 
  children 
}) => {
  return (
    <div className="border rounded-lg p-4 mb-6">
      <h3 className="font-medium mb-2">Продавец: {seller_name}</h3>
      {sellerProfile && (
        <div className="mb-3 space-y-2">
          {sellerProfile.opt_id && (
            <div className="text-sm">
              <span className="text-gray-500">OPT ID: </span>
              <span className="font-medium">{sellerProfile.opt_id}</span>
            </div>
          )}
          {sellerProfile.rating && (
            <div className="flex items-center">
              <div className="text-yellow-500">★★★★★</div>
              <div className="ml-1">
                {sellerProfile.rating} отзывов
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-2">
        {children}
      </div>

      <div className="space-y-3 text-sm mt-4">
        <div className="flex items-center text-gray-700">
          <ShieldCheck className="h-5 w-5 mr-2 text-optapp-yellow" />
          <span>Безопасная сделка через платформу</span>
        </div>
        <div className="flex items-center text-gray-700">
          <CircleDollarSign className="h-5 w-5 mr-2 text-optapp-yellow" />
          <span>Гарантия возврата денег в течение 14 дней</span>
        </div>
      </div>
    </div>
  );
};

export default SellerInfo;
