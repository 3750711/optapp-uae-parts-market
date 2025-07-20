
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { useSimpleProductOffers } from '@/hooks/use-simple-price-offers';
import { SimpleOfferModal } from './SimpleOfferModal';
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
  const { data: offerData, isLoading } = useSimpleProductOffers(product.id);

  // Не показываем кнопку если пользователь не авторизован или это продавец
  if (!user || !profile || profile.id === product.seller_id) {
    return null;
  }

  // Только покупатели и админы могут делать предложения
  if (profile.user_type !== "buyer" && !hasAdminAccess) {
    return null;
  }

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

  const handleClick = () => {
    setIsModalOpen(true);
  };

  // Если у пользователя есть предложение
  if (offerData?.has_pending_offer) {
    const isLeading = offerData.current_user_offer_price >= offerData.max_offer_price;
    
    if (compact) {
      return (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={handleClick}
            className={`relative flex items-center justify-center h-10 w-10 p-0 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
              isLeading 
                ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            }`}
            title={`Ваше предложение: $${offerData.current_user_offer_price}${isLeading ? ' (лидирует)' : ''}`}
          >
            {isLeading && (
              <>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
              </>
            )}
            <span className="text-xs font-bold">${offerData.current_user_offer_price}</span>
          </Button>
          
          <SimpleOfferModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
            currentOffer={offerData.current_user_offer_price}
            maxOffer={offerData.max_offer_price}
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
          className={`flex items-center gap-2 w-full h-9 text-xs px-3 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 ${
            isLeading 
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
          }`}
        >
          {isLeading ? <TrendingUp className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          <span className="font-semibold">${offerData.current_user_offer_price}</span>
          <span className="text-xs opacity-90 ml-auto">
            {isLeading ? 'лидирует' : 'обновить'}
          </span>
        </Button>
        
        <SimpleOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          currentOffer={offerData.current_user_offer_price}
          maxOffer={offerData.max_offer_price}
        />
      </>
    );
  }

  // Если у пользователя нет предложения
  return (
    <>
      <div className="flex items-center gap-2">
        {/* Показываем максимальное предложение если есть */}
        {offerData && offerData.max_offer_price > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">${offerData.max_offer_price}</span>
            {offerData.total_offers_count > 1 && (
              <Users className="h-3 w-3" />
            )}
          </div>
        )}
        
        {compact ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className="flex items-center justify-center h-10 w-10 p-0 hover:bg-primary/10 rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-200 group hover:shadow-lg"
            title={offerData?.max_offer_price ? `Максимальное предложение: $${offerData.max_offer_price}` : "Предложить цену"}
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
      </div>

      <SimpleOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        maxOffer={offerData?.max_offer_price || 0}
      />
    </>
  );
};
