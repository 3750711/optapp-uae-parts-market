
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gavel } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useProductOfferRealtime } from '@/hooks/useProductOfferRealtime';
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
  const [hasActiveOffers, setHasActiveOffers] = useState(product.has_active_offers || false);
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  
  // Add real-time updates for offer status
  useProductOfferRealtime(product.id);
  
  // Sync local state with product prop changes
  useEffect(() => {
    console.log(`🔄 SimpleOfferButton: Product ${product.id} has_active_offers changed:`, {
      oldValue: hasActiveOffers,
      newValue: product.has_active_offers,
      productTitle: product.title,
      timestamp: new Date().toISOString()
    });
    
    setHasActiveOffers(product.has_active_offers || false);
  }, [product.has_active_offers, product.id, product.title]);
  
  // Simplified visibility logic
  if (!user || !profile) return null;
  if (profile.id === product.seller_id) return null;
  if (profile.user_type !== "buyer" && !hasAdminAccess) return null;
  if (product.status !== 'active' && product.status !== 'sold') return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`🖱️ SimpleOfferButton clicked for product ${product.id}`, {
      hasActiveOffers,
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
          variant={hasActiveOffers ? "default" : "outline"}
          size="sm"
          onClick={handleClick}
          className={`flex items-center justify-center h-10 w-10 p-0 rounded-full ${
            hasActiveOffers 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'hover:bg-gray-100'
          }`}
          title={hasActiveOffers ? "Торги идут" : "Предложить цену"}
        >
          {hasActiveOffers ? (
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
        variant={hasActiveOffers ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        className={`flex items-center gap-2 w-full h-9 text-xs px-3 ${
          hasActiveOffers 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'hover:bg-gray-100'
        }`}
      >
        {hasActiveOffers ? (
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
