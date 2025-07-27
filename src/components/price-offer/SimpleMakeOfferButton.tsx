import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { useCheckPendingOffer } from '@/hooks/use-price-offers';
import { EnhancedOfferModal } from './EnhancedOfferModal';

interface SimpleMakeOfferButtonProps {
  product: Product;
  compact?: boolean;
}

export const SimpleMakeOfferButton: React.FC<SimpleMakeOfferButtonProps> = ({ 
  product, 
  compact = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  
  const { data: userOffer, isLoading } = useCheckPendingOffer(
    product.id, 
    !!user
  );

  // Simplified visibility logic
  if (!user || !profile) return null;
  if (profile.id === product.seller_id) return null;
  if (profile.user_type !== "buyer" && !hasAdminAccess) return null;
  if (product.status !== 'active') return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  const buttonText = userOffer 
    ? `Изменить предложение ($${userOffer.offered_price})` 
    : 'Предложить цену';

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        size={compact ? "sm" : "default"}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>

      <EnhancedOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        existingOffer={userOffer}
        isLeadingBid={false}
        maxOtherOffer={0}
      />
    </div>
  );
};