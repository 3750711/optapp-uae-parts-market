
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Zap, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { useCheckPendingOffer, useCompetitiveOffers } from '@/hooks/use-price-offers';
import { EnhancedOfferModal } from './EnhancedOfferModal';
import { CompetitorOfferBadge } from './CompetitorOfferBadge';
import { BatchOfferData, useProductOfferFromBatch } from '@/hooks/use-price-offers-batch';
import { useOptimizedPusherRealtime } from '@/hooks/useOptimizedPusherRealtime';
import { RealtimeBidButton } from './RealtimeBidButton';
import { MaxBidDisplay } from './MaxBidDisplay';
import { PusherConnectionStatus } from './PusherConnectionStatus';
import { cn } from '@/lib/utils';
import bidIcon from '@/assets/bid-icon.png';

interface MakeOfferButtonOptimizedProps {
  product: Product;
  compact?: boolean;
  batchOffersData?: BatchOfferData[];
}

const BidIcon = React.memo(({ className }: { className?: string }) => (
  <img 
    src={bidIcon} 
    alt="Bid" 
    className={className}
    style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(119%) contrast(119%)' }}
  />
));

export const MakeOfferButtonOptimized: React.FC<MakeOfferButtonOptimizedProps> = ({ 
  product, 
  compact = false,
  batchOffersData 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentUpdate, setRecentUpdate] = useState(false);
  const [priceAnimation, setPriceAnimation] = useState(false);
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  
  // Connect to Pusher for real-time updates
  const { 
    connectionState, 
    realtimeEvents, 
    lastUpdateTime, 
    isConnected 
  } = useOptimizedPusherRealtime({
    productId: product.id,
    onEvent: (event) => {
      console.log('🔔 Real-time event received:', event);
      // Trigger visual feedback for updates
      if (event.product_id === product.id) {
        setRecentUpdate(true);
        setPriceAnimation(true);
        setTimeout(() => {
          setRecentUpdate(false);
          setPriceAnimation(false);
        }, 3000);
      }
    }
  });
  
  // Get offer data from batch if available, otherwise use individual query
  const batchOfferData = useProductOfferFromBatch(product.id, batchOffersData);
  
  const shouldLoadDetailedData = (product as any).has_active_offers || !batchOffersData;
  
  const { data: userOffer, isLoading } = useCheckPendingOffer(
    product.id, 
    !!user && shouldLoadDetailedData && !batchOffersData
  );
  
  const { data: competitiveData } = useCompetitiveOffers(
    product.id, 
    !!user && shouldLoadDetailedData && !batchOffersData
  );

  const { isLeadingBid, maxOtherOffer, hasUserOffer, userOfferPrice } = useMemo(() => {
    if (batchOffersData && batchOfferData) {
      const isLeading = batchOfferData.current_user_is_max === true;
      const userPrice = Number(batchOfferData.current_user_offer_price) || 0;
      const maxPrice = Number(batchOfferData.max_offer_price) || 0;
      const hasOffer = batchOfferData.has_pending_offer === true;
      
      let maxOther = 0;
      if (hasOffer && isLeading) {
        maxOther = maxPrice > userPrice ? 0 : maxPrice;
      } else if (hasOffer && !isLeading) {
        maxOther = maxPrice;
      } else if (!hasOffer) {
        maxOther = maxPrice;
      }
      
      return { 
        isLeadingBid: isLeading, 
        maxOtherOffer: maxOther,
        hasUserOffer: hasOffer,
        userOfferPrice: userPrice
      };
    } else if (userOffer || competitiveData) {
      const isLeading = competitiveData?.current_user_is_max === true;
      const userPrice = Number(userOffer?.offered_price) || 0;
      const maxPrice = Number(competitiveData?.max_offer_price) || 0;
      const hasOffer = !!userOffer;
      
      let maxOther = 0;
      if (hasOffer && isLeading) {
        maxOther = 0;
      } else if (hasOffer && !isLeading) {
        maxOther = maxPrice;
      } else if (!hasOffer) {
        maxOther = maxPrice;
      }
      
      return {
        isLeadingBid: isLeading,
        maxOtherOffer: maxOther,
        hasUserOffer: hasOffer,
        userOfferPrice: userPrice
      };
    }
    
    return { 
      isLeadingBid: false, 
      maxOtherOffer: 0, 
      hasUserOffer: false,
      userOfferPrice: 0 
    };
  }, [batchOfferData, userOffer, competitiveData, batchOffersData]);

  // Simplified visibility logic
  if (!user || !profile) return null;
  if (profile.id === product.seller_id) return null;
  if (profile.user_type !== "buyer" && !hasAdminAccess) return null;
  if (product.status !== 'active' && product.status !== 'sold' && !hasUserOffer) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  if (isLoading && !batchOffersData) {
    return (
      <Button 
        variant="outline" 
        size={compact ? "sm" : "default"}
        disabled
        className="animate-pulse"
      >
        Загрузка...
      </Button>
    );
  }

  // Create mock offer for modal if using batch data
  const userOfferForModal = userOffer || (hasUserOffer ? {
    id: '',
    product_id: product.id,
    buyer_id: user.id,
    seller_id: product.seller_id,
    original_price: product.price,
    offered_price: userOfferPrice,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    message: null,
    seller_response: null,
    order_id: null
  } : undefined);

  return (
    <div className={cn(
      "relative transition-all duration-300",
      compact ? "flex items-center gap-2" : "space-y-2",
      recentUpdate && "animate-pulse"
    )}>
      {/* Pusher Connection Status */}
      <PusherConnectionStatus 
        isConnected={isConnected}
        connectionState={connectionState}
        compact={compact}
      />

      {/* Main Bid Button */}
      <RealtimeBidButton
        isLeadingBid={isLeadingBid}
        hasUserOffer={hasUserOffer}
        userOfferPrice={userOfferPrice}
        maxOtherOffer={maxOtherOffer}
        compact={compact}
        onClick={handleClick}
        priceAnimation={priceAnimation}
        recentUpdate={recentUpdate}
      />

      {/* Always show max bid */}
      <MaxBidDisplay 
        maxOtherOffer={maxOtherOffer}
        isUserLeading={isLeadingBid}
        compact={compact}
        hasUserOffer={hasUserOffer}
        userOfferPrice={userOfferPrice}
      />

      {/* Enhanced Offer Modal */}
      <EnhancedOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        existingOffer={userOfferForModal}
        isLeadingBid={isLeadingBid}
        maxOtherOffer={maxOtherOffer}
      />

      {/* Recent update indicator */}
      {recentUpdate && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
      )}
    </div>
  );
};
