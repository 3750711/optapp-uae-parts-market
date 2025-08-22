import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';
import { getCommonTranslations } from '@/utils/translations/common';
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
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { devLog, prodError } from "@/utils/logger";
import { PriceOffersErrorBoundary } from "@/components/offers/PriceOffersErrorBoundary";

const SellerPriceOffers = () => {
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const { startTimer } = usePerformanceMonitor();
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);
  const c = getCommonTranslations(language);
  
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

  // Separate useEffect for component mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Optimized cache refresh with performance monitoring
  useEffect(() => {
    const timer = startTimer('seller-offers-mount');
    devLog('SellerPriceOffers mounted, performing optimized refresh');
    
    // More selective invalidation
    queryClient.invalidateQueries({ 
      queryKey: ['seller-price-offers'], 
      exact: true 
    });
    
    timer.end();
  }, [queryClient, startTimer]);

  const handleGoBack = () => {
    navigate('/seller/dashboard');
  };

  const handleOfferAction = (offer: PriceOffer, action: "accept" | "reject") => {
    console.log('🎯 [OfferAction] Modal opening', {
      offerId: offer.id,
      action: action,
      offerData: offer,
      timestamp: new Date().toISOString()
    });
    
    setResponseModal({ isOpen: true, offer, action });
    setSellerResponse("");
    
    console.log('✅ [OfferAction] Modal state set successfully');
  };

  const handleSubmitResponse = async () => {
    // Enhanced debugging logs
    console.log('🔧 [SubmitResponse] Button clicked', {
      timestamp: new Date().toISOString(),
      mountedRef: mountedRef.current,
      responseModal: responseModal,
      isSubmitting: isSubmitting,
      hasOffer: !!responseModal.offer,
      hasAction: !!responseModal.action,
      offerId: responseModal.offer?.id,
      action: responseModal.action
    });

    // Check early return conditions
    if (!mountedRef.current) {
      console.error('❌ [SubmitResponse] Component not mounted, aborting');
      return;
    }
    
    if (!responseModal.offer) {
      console.error('❌ [SubmitResponse] No offer in responseModal', responseModal);
      toast({
        title: sp.error,
        description: "No offer selected. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!responseModal.action) {
      console.error('❌ [SubmitResponse] No action in responseModal', responseModal);
      toast({
        title: sp.error, 
        description: "No action selected. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (isSubmitting) {
      console.warn('⚠️ [SubmitResponse] Already submitting, ignoring click');
      return;
    }

    const timer = startTimer('offer-response-processing');
    setIsSubmitting(true);
    console.log('✅ [SubmitResponse] Starting submission process');
    
    try {
      const { offer, action } = responseModal;
      console.log(`🚀 [SubmitResponse] Processing offer ${action} for offer ID: ${offer.id}`, {
        offerData: offer,
        sellerResponse: sellerResponse
      });

      // Optimistic update with better type safety
      const newStatus = action === "accept" ? "accepted" : "rejected";
      const response = sellerResponse || undefined;
      
      queryClient.setQueryData(['seller-price-offers'], (oldData: any) => {
        if (!oldData || !mountedRef.current) return oldData;
        return oldData.map((groupedOffer: any) => ({
          ...groupedOffer,
          offers: groupedOffer.offers.map((offerItem: any) =>
            offerItem.id === offer.id 
              ? { 
                  ...offerItem, 
                  status: newStatus,
                  seller_response: response,
                  updated_at: new Date().toISOString()
                }
              : offerItem
          )
        }));
      });

      console.log('🔄 [SubmitResponse] Calling updateOffer.mutateAsync');
      await updateOffer.mutateAsync({
        offerId: offer.id,
        data: {
          status: newStatus,
          seller_response: response,
        },
      });

      console.log('✅ [SubmitResponse] updateOffer.mutateAsync completed successfully');

      if (!mountedRef.current) {
        console.warn('⚠️ [SubmitResponse] Component unmounted after mutation, skipping UI updates');
        return;
      }

      console.log('🎉 [SubmitResponse] Showing success toast and closing modal');

      if (action === "accept") {
        toast({
          title: sp.offerAccepted,
          description: "Order will be created automatically. Refresh the page in a few seconds to see the order link.",
        });
      } else {
        toast({
          title: sp.offerRejected,
          description: "Buyer will be notified of rejection.",
        });
      }

      setResponseModal({ isOpen: false });
      console.log('🔚 [SubmitResponse] Process completed successfully');
    } catch (error) {
      console.error('💥 [SubmitResponse] Error occurred:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = {
        context: 'offer-response-processing',
        offerId: responseModal.offer?.id,
        action: responseModal.action,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      console.error('💥 [SubmitResponse] Error details:', errorDetails);
      
      prodError(error instanceof Error ? error : new Error(String(error)), errorDetails);
      
      // Revert optimistic update on error
      if (mountedRef.current) {
        console.log('🔄 [SubmitResponse] Reverting optimistic update due to error');
        queryClient.invalidateQueries({ 
          queryKey: ['seller-price-offers'], 
          exact: true 
        });
        
        toast({
          title: "Error Processing Offer",
          description: `Failed to ${responseModal.action} offer: ${errorMessage}`,
          variant: "destructive",
        });
      } else {
        console.warn('⚠️ [SubmitResponse] Component unmounted, skipping error UI updates');
      }
    } finally {
      timer.end();
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
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
    <PriceOffersErrorBoundary>
      <SellerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{sp.priceOffers}</h1>
            <p className="text-muted-foreground">
              {sp.managePriceOffers}
            </p>
          </div>

          {!groupedOffers || groupedOffers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{sp.noPriceOffers}</h3>
                <p className="text-muted-foreground">
                  {sp.noPriceOffersDesc}
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
                {responseModal.action === "accept" ? sp.acceptOffer : sp.rejectOffer}
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
                      <div className="text-sm text-muted-foreground">{sp.yourPrice}</div>
                      <div className="font-semibold line-through text-gray-500">
                        {formatPrice(responseModal.offer.original_price)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{sp.offer}</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(responseModal.offer.offered_price)}
                      </div>
                    </div>
                  </div>

                  {responseModal.action === "accept" && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {sp.orderWillBeCreated}
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
                    ? sp.messageTobuyer 
                    : sp.reasonForRejection
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
                  {c.buttons.cancel}
                </Button>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting}
                  className="flex-1"
                  variant={responseModal.action === "accept" ? "default" : "destructive"}
                >
                  {isSubmitting ? sp.processingOffer : 
                   responseModal.action === "accept" ? sp.acceptOffer : sp.rejectOffer
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </SellerLayout>
    </PriceOffersErrorBoundary>
  );
};

export default SellerPriceOffers;
