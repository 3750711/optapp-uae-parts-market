import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { useCheckPendingOffer } from '@/hooks/use-price-offers';
import { EnhancedOfferModal } from './EnhancedOfferModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Check for pending offer
  const { data: userOffer, isLoading: pendingLoading } = useCheckPendingOffer(
    product.id, 
    !!user
  );

  // Get latest offer regardless of status to determine button text
  const { data: latestOffer, isLoading: latestLoading } = useQuery({
    queryKey: ['latest-offer', product.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('price_offers')
        .select('*')
        .eq('product_id', product.id)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = pendingLoading || latestLoading;

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

  // Determine button text based on offer status
  const getButtonText = () => {
    if (userOffer) {
      // User has a pending offer
      return `Изменить предложение ($${userOffer.offered_price})`;
    }
    
    if (latestOffer) {
      // User has a non-pending offer (rejected, expired, cancelled)
      switch (latestOffer.status) {
        case 'rejected':
          return 'Новое предложение';
        case 'expired':
          return 'Новое предложение';
        case 'cancelled':
          return 'Новое предложение';
        case 'accepted':
          return 'Принято'; // This shouldn't happen for active products
        default:
          return 'Предложить цену';
      }
    }
    
    // No previous offers
    return 'Предложить цену';
  };

  const buttonText = getButtonText();

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