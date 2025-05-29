
import React from "react";
import { Link } from "react-router-dom";
import { Star, Copy, CheckCheck } from "lucide-react";
import { SellerProfile } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SellerBasicInfoProps {
  sellerProfile?: SellerProfile | null;
  seller_name: string;
  seller_id: string;
  user: any;
  copied: boolean;
  onCopyOptId: (optId: string) => void;
  onShowContactInfo: () => void;
}

export const SellerBasicInfo: React.FC<SellerBasicInfoProps> = ({
  sellerProfile,
  seller_name,
  seller_id,
  user,
  copied,
  onCopyOptId,
  onShowContactInfo
}) => {
  return (
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
      
      {sellerProfile?.opt_id && user ? (
        <div className="text-sm flex items-center gap-2">
          <span className="text-gray-500">OPT ID: </span>
          <span className="font-medium">{sellerProfile.opt_id}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-400 hover:text-primary" 
                onClick={() => onCopyOptId(sellerProfile.opt_id || '')}
              >
                {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Копировать OPT ID</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : sellerProfile?.opt_id && (
        <div className="text-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary" 
            onClick={onShowContactInfo}
          >
            Показать OPT ID
          </Button>
        </div>
      )}
    </div>
  );
};
