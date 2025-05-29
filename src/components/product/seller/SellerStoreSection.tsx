
import React from "react";
import { Link } from "react-router-dom";
import { Store, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SellerStoreSectionProps {
  storeInfo: {
    id: string;
    name: string;
  } | null;
}

export const SellerStoreSection: React.FC<SellerStoreSectionProps> = ({
  storeInfo
}) => {
  if (storeInfo) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 flex justify-between items-center">
        <div className="flex items-center">
          <Store className="h-5 w-5 mr-2 text-primary" />
          <div>
            <div className="font-medium">{storeInfo.name}</div>
            <div className="text-sm text-gray-600">Магазин продавца</div>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="whitespace-nowrap">
          <Link to={`/stores/${storeInfo.id}`}>
            Посмотреть магазин
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-lg p-3 border border-amber-200 flex items-center">
      <Wrench className="h-5 w-5 mr-2 text-amber-600" />
      <div>
        <div className="font-medium text-amber-800">Профессиональный подбор запчастей</div>
        <div className="text-sm text-amber-700">Продавец специализируется на индивидуальном подборе автозапчастей</div>
      </div>
    </div>
  );
};
