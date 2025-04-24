
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, CircleDollarSign, Star, User } from "lucide-react";
import { SellerProfile } from "@/types/product";

interface SellerInfoProps {
  sellerProfile: SellerProfile;
  seller_name: string;
  seller_id: string;
  children?: React.ReactNode;
}

const SellerInfo: React.FC<SellerInfoProps> = ({ 
  sellerProfile, 
  seller_name,
  seller_id,
  children 
}) => {
  return (
    <div className="border rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <User className="h-5 w-5 mr-2 text-primary" />
        Информация о продавце
      </h3>
      
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              to={`/seller/${seller_id}`}
              className="text-primary font-medium hover:underline transition-colors flex items-center"
            >
              {seller_name}
              <span className="text-xs ml-2 text-gray-500">(Открыть профиль)</span>
            </Link>
            {sellerProfile?.opt_status === 'opt_user' && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
                OPT
              </span>
            )}
          </div>
          
          {sellerProfile?.opt_id && (
            <div className="text-sm">
              <span className="text-gray-500">OPT ID: </span>
              <span className="font-medium">{sellerProfile.opt_id}</span>
            </div>
          )}
        </div>
        
        {sellerProfile?.description_user && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{sellerProfile.description_user}</p>
          </div>
        )}

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
