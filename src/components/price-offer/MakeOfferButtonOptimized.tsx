
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { useCheckPendingOffer, useCompetitiveOffers } from '@/hooks/use-price-offers';
import { EnhancedOfferModal } from './EnhancedOfferModal';
import { CompetitorOfferBadge } from './CompetitorOfferBadge';
import { BatchOfferData, useProductOfferFromBatch } from '@/hooks/use-price-offers-batch';
import { useProductOfferRealtime } from '@/hooks/useProductOfferRealtime';
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
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  
  // Enable real-time updates for this product's offers
  useProductOfferRealtime(product.id);
  
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
      const maxOther = Number(batchOfferData.max_offer_price) || 0;
      const hasOffer = batchOfferData.has_pending_offer === true;
      const userPrice = Number(batchOfferData.current_user_offer_price) || 0;
      
      return { 
        isLeadingBid: isLeading, 
        maxOtherOffer: maxOther,
        hasUserOffer: hasOffer,
        userOfferPrice: userPrice
      };
    } else if (userOffer || competitiveData) {
      const isLeading = competitiveData?.current_user_is_max === true;
      const maxOther = Number(competitiveData?.max_offer_price) || 0;
      const hasOffer = !!userOffer;
      const userPrice = Number(userOffer?.offered_price) || 0;
      
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

  // If user has a pending offer
  if (hasUserOffer && userOfferPrice > 0) {
    if (compact) {
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="default"
            size="sm"
            onClick={handleClick}
            className={`relative flex items-center justify-center h-10 w-12 p-0 rounded-full text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
              isLeadingBid 
                ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            }`}
            title={`${isLeadingBid ? 'Лидирующее предложение' : 'Ваше предложение'}: $${userOfferPrice}`}
          >
            <span className="text-xs font-bold">${userOfferPrice}</span>
          </Button>
          
          <CompetitorOfferBadge maxOtherOffer={maxOtherOffer} compact={true} />
          
          <EnhancedOfferModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
            existingOffer={userOfferForModal}
            isLeadingBid={isLeadingBid}
            maxOtherOffer={maxOtherOffer}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleClick}
          className={`flex items-center gap-2 w-full h-9 text-xs px-3 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 ${
            isLeadingBid 
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
          }`}
        >
          {isLeadingBid ? <TrendingUp className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          <span className="font-semibold">${userOfferPrice}</span>
          <span className="text-xs opacity-90 ml-auto">
            {isLeadingBid ? 'лидер' : 'обновить'}
          </span>
        </Button>
        
        <CompetitorOfferBadge maxOtherOffer={maxOtherOffer} compact={false} />
        
        <EnhancedOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          existingOffer={userOfferForModal}
          isLeadingBid={isLeadingBid}
          maxOtherOffer={maxOtherOffer}
        />
      </div>
    );
  }

  // If user has no pending offer - show make offer button
  return (
    <div className={compact ? "flex items-center gap-1" : "space-y-2"}>
      {compact ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          className="flex items-center justify-center h-10 w-10 p-0 hover:bg-primary/10 rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-200 group hover:shadow-lg"
          title="Предложить цену"
        >
          <BidIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="flex items-center gap-2 w-full h-9 text-xs px-3 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:shadow-md"
        >
          <BidIcon className="h-4 w-4" />
          <span className="font-medium">Предложить</span>
        </Button>
      )}

      <CompetitorOfferBadge maxOtherOffer={maxOtherOffer} compact={compact} />

      <EnhancedOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        isLeadingBid={isLeadingBid}
        maxOtherOffer={maxOtherOffer}
      />
    </div>
  );
};
