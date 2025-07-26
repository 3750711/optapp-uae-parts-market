import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Eye, TrendingUp } from "lucide-react";
import { formatPrice } from "@/utils/formatPrice";
import { useNavigate } from "react-router-dom";

interface CompactOffersSummaryProps {
  productId: string;
}

const CompactOffersSummary: React.FC<CompactOffersSummaryProps> = ({
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
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Offers
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            No price offers yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingOffers = offers.filter(offer => offer.status === 'pending');
  const maxOffer = offers.reduce((max, offer) => 
    offer.offered_price > max ? offer.offered_price : max, 0
  );

  const handleViewOffers = () => {
    navigate('/seller/price-offers', { 
      state: { productId } 
    });
  };

  return (
    <Card className="rounded-none border-0 shadow-none mb-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Offers
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleViewOffers}
            className="h-8 px-2"
          >
            <Eye className="h-3 w-3 mr-1" />
            All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center bg-muted p-2 rounded-lg">
            <div className="text-lg font-bold text-primary">{offers.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          
          <div className="text-center bg-muted p-2 rounded-lg">
            <div className="text-lg font-bold text-accent">{formatPrice(maxOffer)}</div>
            <div className="text-xs text-muted-foreground">Max Price</div>
          </div>
          
          <div className="text-center bg-muted p-2 rounded-lg">
            <div className="text-lg font-bold text-secondary">{pendingOffers.length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Status Badges */}
        {pendingOffers.length > 0 && (
          <div className="flex gap-2 mb-3">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {pendingOffers.length} new
            </Badge>
          </div>
        )}

        {/* Latest Offer */}
        {pendingOffers.length > 0 && (
          <div className="bg-accent/10 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-accent text-sm">
                  {formatPrice(pendingOffers[0].offered_price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  from {pendingOffers[0].profiles?.full_name || 'Buyer'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(pendingOffers[0].created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactOffersSummary;