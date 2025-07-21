
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { useCheckPendingOffer, useCompetitiveOffers } from '@/hooks/use-price-offers';
import { MakeOfferModal } from './MakeOfferModal';
import { CompetitorOfferBadge } from './CompetitorOfferBadge';
import { BatchOfferData, useProductOfferFromBatch } from '@/hooks/use-price-offers-batch';
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
  
  // Get offer data from batch if available, otherwise use individual query
  const batchOfferData = useProductOfferFromBatch(product.id, batchOffersData);
  
  // Use individual query as fallback if batch data is not available
  const { data: userOffer, isLoading } = useCheckPendingOffer(
    product.id, 
    !!user && !batchOffersData
  );
  
  // Get competitive offers data as fallback
  const { data: competitiveData } = useCompetitiveOffers(
    product.id, 
    !!user && !batchOffersData
  );

  // Determine if user's offer is the leading bid and get max other offer
  const { isLeadingBid, maxOtherOffer, hasUserOffer, userOfferPrice } = useMemo(() => {
    if (batchOffersData && batchOfferData) {
      const isLeading = batchOfferData.current_user_is_max === true;
      const maxOther = Number(batchOfferData.max_offer_price) || 0;
      const hasOffer = batchOfferData.has_pending_offer === true;
      const userPrice = Number(batchOfferData.current_user_offer_price) || 0;
      
      console.log('🎯 Batch offer data:', {
        productId: product.id,
        isLeading,
        maxOther,
        hasOffer,
        userPrice,
        batchOfferData
      });
      
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
      
      console.log('🎯 Individual offer data:', {
        productId: product.id,
        isLeading,
        maxOther,
        hasOffer,
        userPrice,
        userOffer,
        competitiveData
      });
      
      return {
        isLeadingBid: isLeading,
        maxOtherOffer: maxOther,
        hasUserOffer: hasOffer,
        userOfferPrice: userPrice
      };
    }
    
    console.log('🎯 No offer data found for product:', product.id);
    return { 
      isLeadingBid: false, 
      maxOtherOffer: 0, 
      hasUserOffer: false,
      userOfferPrice: 0 
    };
  }, [batchOfferData, userOffer, competitiveData, batchOffersData, product.id]);

  console.log('🎯 MakeOfferButtonOptimized render:', {
    productId: product.id,
    userId: user?.id,
    profileId: profile?.id,
    userType: profile?.user_type,
    sellerId: product.seller_id,
    hasUserOffer,
    userOfferPrice,
    isLeadingBid,
    maxOtherOffer,
    isLoading,
    productStatus: product.status,
    shouldShowButton: user && profile && profile.id !== product.seller_id
  });

  // Simplified visibility logic - show button if user is logged in and not the seller
  if (!user || !profile) {
    console.log('🚫 Button hidden - no user or profile');
    return null;
  }

  if (profile.id === product.seller_id) {
    console.log('🚫 Button hidden - user is seller');
    return null;
  }

  // Only buyers and admins can make offers
  if (profile.user_type !== "buyer" && !hasAdminAccess) {
    console.log('🚫 Button hidden - not buyer or admin');
    return null;
  }

  // Don't show for non-active products (except sold ones can still show existing offers)
  if (product.status !== 'active' && product.status !== 'sold' && !hasUserOffer) {
    console.log('🚫 Button hidden - product not active and no existing offer');
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🖱️ Button clicked, opening modal');
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

  // If user has a pending offer
  if (hasUserOffer && userOfferPrice > 0) {
    console.log('👤 User has pending offer:', userOfferPrice, 'isLeading:', isLeadingBid);
    
    const userOfferForModal = userOffer || {
      id: '',
      product_id: product.id,
      buyer_id: user.id,
      seller_id: product.seller_id,
      original_price: product.price,
      offered_price: userOfferPrice,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: null,
      seller_response: null,
      order_id: null
    };
    
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
          
          <MakeOfferModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
            existingOffer={userOfferForModal}
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
        
        <MakeOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          existingOffer={userOfferForModal}
        />
      </div>
    );
  }

  // If user has no pending offer - show make offer button
  console.log('💭 User has no pending offer, showing bid button');

  return (
    <div className={compact ? "flex items-center gap-1" : "space-y-2"}>
      {compact ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={false}
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
          disabled={false}
          className="flex items-center gap-2 w-full h-9 text-xs px-3 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:shadow-md"
        >
          <BidIcon className="h-4 w-4" />
          <span className="font-medium">Предложить</span>
        </Button>
      )}

      <CompetitorOfferBadge maxOtherOffer={maxOtherOffer} compact={compact} />

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </div>
  );
};
