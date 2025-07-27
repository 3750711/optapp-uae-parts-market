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
  const maxOffer = offers.reduce((max, offer) => {
    const offerPrice = Number(offer.offered_price);
    return offerPrice > max ? offerPrice : max;
  }, 0);

  // Sort offers by price (highest to lowest), then by creation date
  const sortedOffers = [...offers].sort((a, b) => {
    const priceA = Number(a.offered_price);
    const priceB = Number(b.offered_price);
    if (priceB !== priceA) {
      return priceB - priceA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
      accepted: { className: "bg-green-100 text-green-800", label: "Accepted" },
      rejected: { className: "bg-red-100 text-red-800", label: "Rejected" },
      expired: { className: "bg-gray-100 text-gray-800", label: "Expired" },
      cancelled: { className: "bg-gray-100 text-gray-800", label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant="secondary" className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

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

        {/* All Offers - sorted by price */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground mb-2">All Offers</div>
          {sortedOffers.slice(0, 7).map((offer, index) => (
            <div key={offer.id} className={`p-3 rounded-lg border ${offer.status === 'pending' ? 'bg-green-50 border-green-200' : 'bg-muted/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-foreground text-sm">
                  {formatPrice(offer.offered_price)}
                </div>
                {getStatusBadge(offer.status)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>from {offer.profiles?.full_name || 'Buyer'}</span>
                <span>{new Date(offer.created_at).toLocaleDateString()}</span>
              </div>
              {offer.message && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  "{offer.message}"
                </div>
              )}
            </div>
          ))}
          
          {sortedOffers.length > 7 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewOffers}
                className="text-xs"
              >
                Show {sortedOffers.length - 7} more offers
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactOffersSummary;