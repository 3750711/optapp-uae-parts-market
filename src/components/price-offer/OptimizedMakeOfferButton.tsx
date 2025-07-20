
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp } from "lucide-react";
import { MakeOfferModal } from "./MakeOfferModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Product } from "@/types/product";
import { MakeOfferButtonSkeleton } from "./MakeOfferButtonSkeleton";
import { CompetitorOfferBadge } from "./CompetitorOfferBadge";
import { useProductOfferFromBatch, BatchOfferData } from "@/hooks/use-price-offers-batch";
import { useCheckPendingOffer } from "@/hooks/use-price-offers";
import bidIcon from "@/assets/bid-icon.png";

interface OptimizedMakeOfferButtonProps {
  product: Product;
  batchOfferData?: BatchOfferData[];
  disabled?: boolean;
  compact?: boolean;
  useFallback?: boolean;
}

const BidIcon = React.memo(({ className }: { className?: string }) => (
  <img 
    src={bidIcon} 
    alt="Bid" 
    className={className}
    style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(119%) contrast(119%)' }}
  />
));

export const OptimizedMakeOfferButton = React.memo(({
  product,
  batchOfferData,
  disabled = false,
  compact = false,
  useFallback = false,
}: OptimizedMakeOfferButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  
  // Get offer data from batch or fallback to individual queries
  const offerData = useProductOfferFromBatch(product.id, batchOfferData);
  
  // Fallback to individual queries if batch data is not available
  const { data: pendingOffer, isLoading: isPendingLoading } = useCheckPendingOffer(
    product.id, 
    useFallback && !batchOfferData && !!user
  );

  // Process the offer data correctly
  const {
    maxOtherOffer,
    isMaxOffer,
    hasPendingOffer,
    userOfferPrice,
    totalOffers
  } = useMemo(() => {
    console.log('🔄 OptimizedMakeOfferButton processing data for product:', product.id, {
      batchOfferData: !!batchOfferData,
      offerData,
      pendingOffer
    });

    if (batchOfferData && offerData) {
      // Use batch data - the logic is already correct in get_offers_batch
      const result = {
        maxOtherOffer: offerData.max_offer_price,
        isMaxOffer: offerData.current_user_is_max,
        hasPendingOffer: offerData.has_pending_offer,
        userOfferPrice: offerData.current_user_offer_price,
        totalOffers: offerData.total_offers_count
      };
      
      console.log('🔄 Batch data result:', result);
      return result;
    }
    
    // Fallback to individual query data
    const fallbackResult = {
      maxOtherOffer: 0,
      isMaxOffer: false,
      hasPendingOffer: !!pendingOffer,
      userOfferPrice: pendingOffer?.offered_price || 0,
      totalOffers: 0
    };
    
    console.log('🔄 Fallback data result:', fallbackResult);
    return fallbackResult;
  }, [offerData, pendingOffer, batchOfferData, product.id]);

  // Create pending offer object for modal compatibility
  const pendingOfferForModal = useMemo(() => {
    if (!hasPendingOffer || userOfferPrice === 0) return null;
    
    if (pendingOffer) {
      return pendingOffer;
    }
    
    // Create mock pending offer from batch data
    return {
      id: `pending-${product.id}`,
      offered_price: userOfferPrice,
      status: 'pending' as const,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      message: undefined
    };
  }, [hasPendingOffer, userOfferPrice, pendingOffer, product.id]);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  // Show button only for buyers and admins, but not for the seller
  if (!user || !profile || profile.id === product.seller_id) {
    return null;
  }

  // Only show for buyers and admins
  if (profile.user_type !== "buyer" && !hasAdminAccess) {
    return null;
  }

  // Show loading state while data is being fetched (only for fallback mode)
  if (useFallback && !batchOfferData && isPendingLoading) {
    return <MakeOfferButtonSkeleton compact={compact} />;
  }

  // If user has pending offer, show appropriate button
  if (hasPendingOffer) {
    // If user is leading, show green success button
    if (isMaxOffer) {
      return (
        <>
          {compact ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenModal}
              disabled={disabled}
              className="relative flex items-center justify-center h-10 w-10 p-0 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              title={`Ваше предложение: $${userOfferPrice} (максимальное)`}
            >
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-xs font-bold">${userOfferPrice}</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenModal}
              disabled={disabled}
              className="flex items-center gap-2 w-full h-9 text-xs px-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">${userOfferPrice}</span>
              <span className="text-xs opacity-90 ml-auto">лидирует</span>
            </Button>
          )}

          <MakeOfferModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
            existingOffer={pendingOfferForModal ? {
              ...pendingOfferForModal,
              message: pendingOfferForModal.message || undefined
            } : undefined}
          />
        </>
      );
    }

    // If user is NOT leading and there are other offers, show combined horizontal button
    if (maxOtherOffer > 0) {
      return (
        <>
          {compact ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenModal}
              disabled={disabled}
              className="relative flex items-center h-10 w-16 px-1 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:via-orange-700 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 rounded-lg"
              title={`Максимальное: $${maxOtherOffer}, ваше: $${userOfferPrice}`}
            >
              <div className="flex flex-col items-center text-[10px] font-bold leading-none">
                <span className="opacity-80">{maxOtherOffer}</span>
                <div className="w-4 h-px bg-white/40 my-0.5"></div>
                <span className="text-[9px]">{userOfferPrice}</span>
              </div>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenModal}
              disabled={disabled}
              className="flex items-center w-full h-9 text-xs px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center gap-1 opacity-90">
                  <span className="text-xs">другой</span>
                  <span className="font-semibold">${maxOtherOffer}</span>
                </div>
                <div className="w-px h-4 bg-white/30"></div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  <span className="font-semibold">${userOfferPrice}</span>
                </div>
                <span className="text-xs opacity-75 ml-auto">обновить</span>
              </div>
            </Button>
          )}

          <MakeOfferModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
            existingOffer={pendingOfferForModal ? {
              ...pendingOfferForModal,
              message: pendingOfferForModal.message || undefined
            } : undefined}
          />
        </>
      );
    }

    // If user is NOT leading but no other offers, show orange button with user's offer
    return (
      <>
        {compact ? (
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenModal}
            disabled={disabled}
            className="relative flex items-center justify-center h-10 w-10 p-0 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            title={`Ваше предложение: $${userOfferPrice}`}
          >
            <Clock className="h-4 w-4 animate-spin" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenModal}
            disabled={disabled}
            className="flex items-center gap-2 w-full h-9 text-xs px-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          >
            <Clock className="h-4 w-4 animate-spin" />
            <span className="font-semibold">${userOfferPrice}</span>
            <span className="text-xs opacity-90 ml-auto">обновить</span>
          </Button>
        )}

        <MakeOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          existingOffer={pendingOfferForModal ? {
            ...pendingOfferForModal,
            message: pendingOfferForModal.message || undefined
          } : undefined}
        />
      </>
    );
  }

  // No pending offer - show max offer from others and make offer button
  return (
    <>
      <div className="flex items-center gap-2">
        {/* Show competitor badge if there are other offers */}
        {maxOtherOffer > 0 && (
          <CompetitorOfferBadge maxOtherOffer={maxOtherOffer} compact={compact} />
        )}
        
        {compact ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenModal}
            disabled={disabled}
            className="flex items-center justify-center h-10 w-10 p-0 hover:bg-primary/10 rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-200 group hover:shadow-lg backdrop-blur-sm"
            title={maxOtherOffer > 0 ? `Максимальное предложение: $${maxOtherOffer}` : "Предложить цену"}
          >
            <BidIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenModal}
            disabled={disabled}
            className="flex items-center gap-2 w-full h-9 text-xs px-3 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:shadow-md backdrop-blur-sm"
          >
            <BidIcon className="h-4 w-4" />
            <span className="font-medium">Предложить</span>
          </Button>
        )}
      </div>

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
});

OptimizedMakeOfferButton.displayName = "OptimizedMakeOfferButton";
