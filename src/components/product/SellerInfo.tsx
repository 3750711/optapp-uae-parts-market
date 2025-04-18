
import React from "react";
import { ShieldCheck, CircleDollarSign, Star } from "lucide-react";
import { SellerProfile } from "@/types/product";

interface SellerInfoProps {
  sellerProfile: SellerProfile;
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
        <div className="mb-3">
          <div className="flex items-center space-x-4 mb-2">
            {sellerProfile.opt_id && (
              <div className="text-sm">
                <span className="text-gray-500">OPT ID: </span>
                <span className="font-medium">{sellerProfile.opt_id}</span>
              </div>
            )}
            {sellerProfile.rating !== null && sellerProfile.rating !== undefined && (
              <div className="flex items-center">
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(sellerProfile.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm">
                  <span className="font-medium">{sellerProfile.rating?.toFixed(1)}</span>
                  <span className="text-gray-500"> / 5</span>
                </span>
              </div>
            )}
          </div>
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

