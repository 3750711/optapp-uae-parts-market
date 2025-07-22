
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gavel } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useProductOfferRealtime } from '@/hooks/useProductOfferRealtime';
import { useOfferContext } from '@/contexts/OfferContext';
import { Product } from '@/types/product';
import { EnhancedOfferModal } from './EnhancedOfferModal';
import bidIcon from '@/assets/bid-icon.png';

interface SimpleOfferButtonProps {
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

export const SimpleOfferButton: React.FC<SimpleOfferButtonProps> = ({ 
  product, 
  compact = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const { getOfferState, setOfferState } = useOfferContext();
  
  // Add real-time updates for offer status
  useProductOfferRealtime(product.id);
  
  // Get offer state from context with fallback to product props
  const { hasActiveOffers, isProcessing } = getOfferState(product.id);
  const actualHasActiveOffers = product.has_active_offers || hasActiveOffers || false;
  
  console.log(`🔍 SimpleOfferButton render for product ${product.id}:`, {
    productHasActiveOffers: product.has_active_offers,
    contextHasActiveOffers: hasActiveOffers,
    actualHasActiveOffers,
    isProcessing,
    productTitle: product.title
  });
  
  // Sync context state with product prop changes
  useEffect(() => {
    const productHasOffers = product.has_active_offers || false;
    if (productHasOffers !== hasActiveOffers) {
      console.log(`🔄 SimpleOfferButton: Syncing offer state for product ${product.id}:`, {
        oldValue: hasActiveOffers,
        newValue: productHasOffers,
        productTitle: product.title,
        timestamp: new Date().toISOString()
      });
      setOfferState(product.id, productHasOffers);
    }
  }, [product.has_active_offers, product.id, hasActiveOffers, setOfferState]);
  
  // Simplified visibility logic
  if (!user || !profile) return null;
  if (profile.id === product.seller_id) return null;
  if (profile.user_type !== "buyer" && !hasAdminAccess) return null;
  if (product.status !== 'active' && product.status !== 'sold') return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`🖱️ SimpleOfferButton clicked for product ${product.id}`, {
      hasActiveOffers: actualHasActiveOffers,
      isProcessing,
      productTitle: product.title
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    console.log(`❌ Modal closed for product ${product.id}`);
    setIsModalOpen(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant={actualHasActiveOffers ? "default" : "outline"}
          size="sm"
          onClick={handleClick}
          disabled={isProcessing}
          className={`flex items-center justify-center h-10 w-10 p-0 rounded-full ${
            actualHasActiveOffers 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'hover:bg-gray-100'
          } ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
          title={
            isProcessing 
              ? "Обрабатывается..." 
              : actualHasActiveOffers 
                ? "Торги идут" 
                : "Предложить цену"
          }
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : actualHasActiveOffers ? (
            <Gavel className="h-4 w-4" />
          ) : (
            <BidIcon className="h-5 w-5" />
          )}
        </Button>
        
        <EnhancedOfferModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          product={product}
          isLeadingBid={false}
          maxOtherOffer={0}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant={actualHasActiveOffers ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={isProcessing}
        className={`flex items-center gap-2 w-full h-9 text-xs px-3 ${
          actualHasActiveOffers 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'hover:bg-gray-100'
        } ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Обрабатывается...</span>
          </>
        ) : actualHasActiveOffers ? (
          <>
            <Gavel className="h-4 w-4" />
            <span className="font-medium">Торги идут</span>
          </>
        ) : (
          <>
            <BidIcon className="h-4 w-4" />
            <span className="font-medium">Предложить</span>
          </>
        )}
      </Button>

      <EnhancedOfferModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        product={product}
        isLeadingBid={false}
        maxOtherOffer={0}
      />
    </div>
  );
};
