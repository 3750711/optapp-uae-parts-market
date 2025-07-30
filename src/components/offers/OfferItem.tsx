import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Check, X, User, MessageSquare, ShoppingCart, RefreshCw } from 'lucide-react';
import { PriceOffer } from '@/types/price-offer';
import { formatDistanceToNow } from 'date-fns';
import { formatPrice } from '@/utils/formatPrice';
import { useNavigate } from 'react-router-dom';

interface OfferItemProps {
  offer: PriceOffer;
  onAccept: (offer: PriceOffer) => void;
  onReject: (offer: PriceOffer) => void;
}

export const OfferItem: React.FC<OfferItemProps> = ({ offer, onAccept, onReject }) => {
  const navigate = useNavigate();
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expirationTime = new Date(expiresAt);
    const now = new Date();
    
    if (expirationTime <= now) {
      return "Expired";
    }
    
    return `Expires ${formatDistanceToNow(expirationTime, {
      addSuffix: true,
    })}`;
  };

  const isOfferExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  const isPending = offer.status === 'pending' && !isOfferExpired(offer.expires_at);

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${isPending ? 'border-yellow-200 bg-yellow-50/30' : 'border-border'}`}>
      {/* Header with buyer info and status */}
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm">
                {offer.buyer_profile?.full_name || 'Unknown Buyer'}
              </div>
              <div className="text-xs text-muted-foreground">
                OPT ID: {offer.buyer_profile?.opt_id || 'Not specified'}
              </div>
            </div>
          </div>
          {offer.buyer_profile?.telegram && (
            <div className="text-xs text-muted-foreground hidden sm:block">
              {offer.buyer_profile.telegram.startsWith('@') ? offer.buyer_profile.telegram : `@${offer.buyer_profile.telegram}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge(offer.status)}
        </div>
      </div>

      {/* Price and time info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Offered Price</div>
            <div className="text-lg font-bold text-green-600">
              {formatPrice(offer.offered_price)}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isPending ? getTimeRemaining(offer.expires_at) : formatDistanceToNow(new Date(offer.updated_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Message */}
      {offer.message && (
        <div className="bg-gray-50 rounded p-2 border">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Message:
          </div>
          <div className="text-sm">{offer.message}</div>
        </div>
      )}

      {/* Seller response */}
      {offer.seller_response && (
        <div className="bg-blue-50 rounded p-2 border border-blue-200">
          <div className="text-xs text-blue-600 mb-1">Your Response:</div>
          <div className="text-sm text-blue-800">{offer.seller_response}</div>
        </div>
      )}

      {/* Order status */}
      {offer.status === 'accepted' && offer.order_id && (
        <div className="bg-green-50 rounded p-2 border border-green-200">
          <div className="text-xs text-green-800 mb-2 flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            Order Created
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/seller/order-details/${offer.order_id}`)}
          >
            View Order
          </Button>
        </div>
      )}

      {offer.status === 'accepted' && !offer.order_id && (
        <div className="bg-blue-50 rounded p-2 border border-blue-200">
          <div className="text-xs text-blue-800 flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Creating order...
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Order is being created automatically. Refresh the page in a few seconds.
          </div>
        </div>
      )}

      {/* Action buttons for pending offers */}
      {isPending && (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onAccept(offer)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            <Check className="h-3 w-3 mr-1" />
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={() => onReject(offer)}
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50 flex-1"
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};