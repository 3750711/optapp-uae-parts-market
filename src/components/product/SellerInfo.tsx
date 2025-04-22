
import React from "react";
import { Link } from "react-router-dom";
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
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          {sellerProfile && sellerProfile.id ? (
            <Link 
              to={`/seller/${sellerProfile.id}`}
              className="font-medium hover:text-primary transition-colors"
            >
              Продавец: {seller_name}
            </Link>
          ) : (
            <span className="font-medium">
              Продавец: {seller_name}
            </span>
          )}
          {sellerProfile?.opt_id && (
            <div className="text-sm">
              <span className="text-gray-500">OPT ID: </span>
              <span className="font-medium">{sellerProfile.opt_id}</span>
            </div>
          )}
        </div>

        {sellerProfile?.rating !== null && sellerProfile?.rating !== undefined && (
          <div className="flex items-center">
            <div className="flex mr-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`h-4 w-4 ${
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
      
      <div className="grid grid-cols-1 gap-2 mt-4">
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
