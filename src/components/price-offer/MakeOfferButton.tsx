
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { useCheckPendingOffer } from '@/hooks/use-price-offers';
import { MakeOfferModal } from './MakeOfferModal';
import bidIcon from '@/assets/bid-icon.png';

interface MakeOfferButtonProps {
  product: Product;
  compact?: boolean;
}

const BidIcon = React.memo(({ className }: { className?: string }) => (
  <img 
    src={bidIcon} 
    alt="Bid" 
    className={className}
    style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(119%) contrast(119%)' }}
  />
));

export const MakeOfferButton: React.FC<MakeOfferButtonProps> = ({ 
  product, 
  compact = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  
  // Get user's pending offer for this product
  const { data: userOffer, isLoading } = useCheckPendingOffer(product.id, !!user);

  console.log('🎯 MakeOfferButton render:', {
    productId: product.id,
    userId: user?.id,
    profileId: profile?.id,
    userType: profile?.user_type,
    sellerId: product.seller_id,
    userOffer,
    isLoading
  });

  // Don't show button if user is not logged in or is the seller
  if (!user || !profile || profile.id === product.seller_id) {
    console.log('🚫 Button hidden - no user or is seller');
    return null;
  }

  // Only buyers and admins can make offers
  if (profile.user_type !== "buyer" && !hasAdminAccess) {
    console.log('🚫 Button hidden - not buyer or admin');
    return null;
  }

  const handleClick = () => {
    console.log('🖱️ Button clicked, opening modal');
    setIsModalOpen(true);
  };

  if (isLoading) {
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
  if (userOffer) {
    console.log('👤 User has pending offer:', userOffer.offered_price);
    
    if (compact) {
      return (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={handleClick}
            className="relative flex items-center justify-center h-10 w-10 p-0 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            title={`Ваше предложение: $${userOffer.offered_price}`}
          >
            <Clock className="h-4 w-4" />
          </Button>
          
          <MakeOfferModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
            existingOffer={userOffer}
          />
        </>
      );
    }

    return (
      <>
        <Button
          variant="default"
          size="sm"
          onClick={handleClick}
          className="flex items-center gap-2 w-full h-9 text-xs px-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
        >
          <Clock className="h-4 w-4" />
          <span className="font-semibold">${userOffer.offered_price}</span>
          <span className="text-xs opacity-90 ml-auto">обновить</span>
        </Button>
        
        <MakeOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          existingOffer={userOffer}
        />
      </>
    );
  }

  // If user has no pending offer - show make offer button
  console.log('💭 User has no pending offer, showing bid button');

  return (
    <>
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

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
};
