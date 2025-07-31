import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import SellerLayout from "@/components/layout/SellerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  DollarSign,
  ShoppingCart
} from "lucide-react";
import { useUpdatePriceOffer } from "@/hooks/use-price-offers";
import { useSellerOffersGrouped } from "@/hooks/useSellerOffersGrouped";
import { PriceOffer } from "@/types/price-offer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/utils/formatPrice";
import { ProductOffersCard } from "@/components/offers/ProductOffersCard";

const SellerPriceOffers = () => {
  const navigate = useNavigate();
  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    offer?: PriceOffer;
    action?: "accept" | "reject";
  }>({ isOpen: false });
  const [sellerResponse, setSellerResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: groupedOffers, isLoading } = useSellerOffersGrouped();
  const updateOffer = useUpdatePriceOffer();

  // Force refetch on component mount and clear cache
  useEffect(() => {
    console.log('🔄 SellerPriceOffers mounted, clearing cache and refetching...');
    queryClient.removeQueries({ queryKey: ['seller-price-offers'] });
    queryClient.refetchQueries({ queryKey: ['seller-price-offers'] });
  }, [queryClient]);

  const handleGoBack = () => {
    navigate('/seller/dashboard');
  };

  const handleOfferAction = (offer: PriceOffer, action: "accept" | "reject") => {
    setResponseModal({ isOpen: true, offer, action });
    setSellerResponse("");
  };

  const handleSubmitResponse = async () => {
    if (!responseModal.offer || !responseModal.action) return;

    setIsSubmitting(true);
    try {
      const { offer, action } = responseModal;

      console.log(`Processing offer ${action} for offer ID: ${offer.id}`);

      // Simply update the offer status - the trigger will handle order creation
      await updateOffer.mutateAsync({
        offerId: offer.id,
        data: {
          status: action === "accept" ? "accepted" : "rejected",
          seller_response: sellerResponse || undefined,
        },
      });

      if (action === "accept") {
        toast({
          title: "Offer Accepted!",
          description: "Order will be created automatically. Refresh the page in a few seconds to see the order link.",
        });
      } else {
        toast({
          title: "Offer Rejected",
          description: "Buyer will be notified of rejection.",
        });
      }

      setResponseModal({ isOpen: false });
    } catch (error) {
      console.error("Error processing offer:", error);
      toast({
        title: "Error",
        description: "Failed to process offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </SellerLayout>
    );
  }


  return (
    <SellerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Price Offers</h1>
          <p className="text-muted-foreground">
            Manage price offers for your products
          </p>
        </div>

        {!groupedOffers || groupedOffers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Price Offers</h3>
              <p className="text-muted-foreground">
                No one has made price offers for your products yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedOffers.map((groupedOffer) => (
              <ProductOffersCard
                key={groupedOffer.product.id}
                groupedOffer={groupedOffer}
                onAcceptOffer={(offer) => handleOfferAction(offer, "accept")}
                onRejectOffer={(offer) => handleOfferAction(offer, "reject")}
              />
            ))}
          </div>
        )}

        {/* Response Modal */}
        <Dialog 
          open={responseModal.isOpen} 
          onOpenChange={(open) => !open && setResponseModal({ isOpen: false })}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {responseModal.action === "accept" ? "Accept Offer" : "Reject Offer"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {responseModal.offer && (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex gap-3">
                    {responseModal.offer.product?.product_images?.[0] && (
                      <img
                        src={responseModal.offer.product.product_images[0].url}
                        alt={responseModal.offer.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium">{responseModal.offer.product?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {responseModal.offer.product?.brand} {responseModal.offer.product?.model}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground">Your Price</div>
                      <div className="font-semibold line-through text-gray-500">
                        {formatPrice(responseModal.offer.original_price)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Offer</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(responseModal.offer.offered_price)}
                      </div>
                    </div>
                  </div>

                  {responseModal.action === "accept" && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Order will be created automatically
                      </p>
                      <p className="text-xs text-green-700">
                        After accepting the offer, order will be created automatically
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="response">
                  {responseModal.action === "accept" 
                    ? "Message to buyer (optional)"
                    : "Reason for rejection (optional)"
                  }
                </Label>
                <Textarea
                  id="response"
                  value={sellerResponse}
                  onChange={(e) => setSellerResponse(e.target.value)}
                  placeholder={
                    responseModal.action === "accept"
                      ? "Thank you for your offer! I accept your price."
                      : "Unfortunately, I cannot accept this price..."
                  }
                  rows={3}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResponseModal({ isOpen: false })}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting}
                  className="flex-1"
                  variant={responseModal.action === "accept" ? "default" : "destructive"}
                >
                  {isSubmitting ? "Processing..." : 
                   responseModal.action === "accept" ? "Accept Offer" : "Reject"
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SellerLayout>
  );
};

export default SellerPriceOffers;
