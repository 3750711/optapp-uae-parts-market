
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { MakeOfferModal } from "./MakeOfferModal";
import { useCheckPendingOffer, useCompetitiveOffers } from "@/hooks/use-price-offers";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface MakeOfferButtonProps {
  product: Product;
  disabled?: boolean;
  compact?: boolean; // Для каталога - иконка, для страницы товара - полная кнопка
}

// Add Product import
import { Product } from "@/types/product";
import bidIcon from "@/assets/bid-icon.png";

// Компонент иконки с использованием загруженного изображения
const BidIcon = ({ className }: { className?: string }) => (
  <img 
    src={bidIcon} 
    alt="Bid" 
    className={className}
    style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(119%) contrast(119%)' }}
  />
);

export const MakeOfferButton = ({
  product,
  disabled = false,
  compact = false,
}: MakeOfferButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const { data: pendingOffer } = useCheckPendingOffer(product.id, !!user);
  const { data: competitiveData } = useCompetitiveOffers(product.id, !!user);

  // Show button only for buyers and admins, but not for the seller
  if (!user || !profile || profile.id === product.seller_id) {
    return null;
  }

  // Only show for buyers and admins
  if (profile.user_type !== "buyer" && !hasAdminAccess) {
    return null;
  }

  // If user has pending offer, show button with competitive info
  if (pendingOffer) {
    const isMaxOffer = competitiveData?.current_user_is_max || false;
    const maxOtherOffer = competitiveData?.max_offer_price || 0;
    
    // Determine button text based on offer status
    const getButtonText = () => {
      if (isMaxOffer) {
        return compact ? "лидирует" : " (лидирует)";
      } else if (maxOtherOffer > 0) {
        return compact ? `макс.$${maxOtherOffer}` : ` (макс.$${maxOtherOffer})`;
      } else {
        return compact ? "обновить" : " (обновить)";
      }
    };
    
    return (
      <>
        {compact ? (
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsModalOpen(true);
            }}
            disabled={disabled}
            className={`flex flex-col items-center justify-center h-9 w-9 p-0 rounded-full relative text-white ${
              isMaxOffer 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-orange-500 hover:bg-orange-600"
            }`}
            title={`Ваше предложение: $${pendingOffer.offered_price}${isMaxOffer ? ' (максимальное)' : ''}`}
          >
            <Clock className="h-1.5 w-1.5 animate-spin mb-0.5" />
            <span className="text-[9px] font-bold leading-none">${pendingOffer.offered_price}</span>
            <span className="text-[8px] leading-none">{getButtonText()}</span>
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsModalOpen(true);
            }}
            disabled={disabled}
            className={`flex items-center gap-1 w-full h-9 text-xs px-2 text-white ${
              isMaxOffer 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            <Clock className="h-3 w-3 animate-spin" />
            ${pendingOffer.offered_price}
            {getButtonText()}
          </Button>
        )}

        <MakeOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          existingOffer={pendingOffer ? {
            ...pendingOffer,
            message: pendingOffer.message || undefined
          } : undefined}
        />
      </>
    );
  }

  // No pending offer - show max offer from others and make offer button
  const maxOtherOffer = competitiveData?.max_offer_price || 0;
  
  return (
    <>
      {compact ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsModalOpen(true);
          }}
          disabled={disabled}
          className="flex items-center justify-center h-9 w-9 p-0 hover:bg-primary/10 rounded-full border border-gray-200 hover:border-primary/20 transition-colors"
          title={maxOtherOffer > 0 ? `Максимальное предложение: $${maxOtherOffer}` : "Предложить цену"}
        >
          <BidIcon className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsModalOpen(true);
          }}
          disabled={disabled}
          className="flex items-center gap-1 w-full h-9 text-xs px-2"
          title={maxOtherOffer > 0 ? `Максимальное предложение: $${maxOtherOffer}` : undefined}
        >
          <BidIcon className="h-3 w-3" />
          {maxOtherOffer > 0 ? `Предложить (макс.$${maxOtherOffer})` : "Предложить"}
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
