import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, TrendingUp, Eye } from "lucide-react";
import { formatPrice } from "@/utils/formatPrice";
import { useNavigate } from "react-router-dom";

interface SellerOffersSummaryProps {
  productId: string;
}

const SellerOffersSummary: React.FC<SellerOffersSummaryProps> = ({
  productId,
}) => {
  const navigate = useNavigate();

  // Fetch offers for this product
  const { data: offers, isLoading } = useQuery({
    queryKey: ['product-offers', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          *,
          profiles!price_offers_buyer_id_fkey(full_name, opt_id)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Предложения цены
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Предложения цены
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Пока нет предложений цены для этого объявления.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingOffers = offers.filter(offer => offer.status === 'pending');
  const acceptedOffers = offers.filter(offer => offer.status === 'accepted');
  const rejectedOffers = offers.filter(offer => offer.status === 'rejected');
  
  const maxOffer = offers.reduce((max, offer) => 
    offer.offered_price > max ? offer.offered_price : max, 0
  );
  
  const avgOffer = offers.length > 0 
    ? offers.reduce((sum, offer) => sum + offer.offered_price, 0) / offers.length 
    : 0;

  const handleViewOffers = () => {
    navigate('/seller/price-offers', { 
      state: { productId } 
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Предложения цены
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewOffers}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Просмотреть все
        </Button>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {offers.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Всего предложений
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(maxOffer)}
            </div>
            <div className="text-sm text-muted-foreground">
              Максимальная цена
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(avgOffer)}
            </div>
            <div className="text-sm text-muted-foreground">
              Средняя цена
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {pendingOffers.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Ожидают ответа
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pendingOffers.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" />
              {pendingOffers.length} ожидают
            </Badge>
          )}
          {acceptedOffers.length > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              {acceptedOffers.length} принято
            </Badge>
          )}
          {rejectedOffers.length > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {rejectedOffers.length} отклонено
            </Badge>
          )}
        </div>

        {/* Recent Offers */}
        {pendingOffers.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Последние предложения:</h4>
            <div className="space-y-2">
              {pendingOffers.slice(0, 3).map((offer) => (
                <div 
                  key={offer.id} 
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {formatPrice(offer.offered_price)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      от {offer.profiles?.full_name || 'Покупатель'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(offer.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerOffersSummary;