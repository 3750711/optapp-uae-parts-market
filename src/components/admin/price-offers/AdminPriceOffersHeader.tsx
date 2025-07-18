import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, DollarSign } from "lucide-react";
import { PriceOffer } from "@/types/price-offer";

interface AdminPriceOffersHeaderProps {
  offers: PriceOffer[] | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export const AdminPriceOffersHeader: React.FC<AdminPriceOffersHeaderProps> = ({
  offers,
  isLoading,
  onRefresh
}) => {
  const getStatusCounts = () => {
    if (!offers) return { pending: 0, accepted: 0, rejected: 0, expired: 0, cancelled: 0 };
    
    return {
      pending: offers.filter(o => o.status === 'pending').length,
      accepted: offers.filter(o => o.status === 'accepted').length,
      rejected: offers.filter(o => o.status === 'rejected').length,
      expired: offers.filter(o => o.status === 'expired').length,
      cancelled: offers.filter(o => o.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Предложения цены
        </CardTitle>
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </>
        ) : (
          <>
            <Badge variant="outline">Всего: {offers?.length ?? 0}</Badge>
            {statusCounts.pending > 0 && (
              <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                {statusCounts.pending} ожидает
              </Badge>
            )}
            {statusCounts.accepted > 0 && (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                {statusCounts.accepted} принято
              </Badge>
            )}
            {statusCounts.rejected > 0 && (
              <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-200">
                {statusCounts.rejected} отклонено
              </Badge>
            )}
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>
    </CardHeader>
  );
};