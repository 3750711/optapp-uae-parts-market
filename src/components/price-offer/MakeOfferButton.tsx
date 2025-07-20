
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { MakeOfferModal } from "./MakeOfferModal";
import { useCheckPendingOffer, useCompetitiveOffers } from "@/hooks/use-price-offers";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Product } from "@/types/product";
import { MakeOfferButtonSkeleton } from "./MakeOfferButtonSkeleton";
import { CompetitorOfferBadge } from "./CompetitorOfferBadge";
import bidIcon from "@/assets/bid-icon.png";

interface MakeOfferButtonProps {
  product: Product;
  disabled?: boolean;
  compact?: boolean;
}

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
  
  const { data: pendingOffer, isLoading: isPendingLoading } = useCheckPendingOffer(product.id, !!user);
  const { data: competitiveData, isLoading: isCompetitiveLoading } = useCompetitiveOffers(product.id, !!user);

  // Show button only for buyers and admins, but not for the seller
  if (!user || !profile || profile.id === product.seller_id) {
    return null;
  }

  // Only show for buyers and admins
  if (profile.user_type !== "buyer" && !hasAdminAccess) {
    return null;
  }

  // Show loading state while data is being fetched
  if (isPendingLoading || isCompetitiveLoading) {
    return <MakeOfferButtonSkeleton compact={compact} />;
  }

  const isMaxOffer = competitiveData?.current_user_is_max || false;
  const maxOtherOffer = competitiveData?.max_offer_price || 0;

  // If user has pending offer, show combined or single button
  if (pendingOffer) {
    // If user is leading, show green success button
    if (isMaxOffer) {
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
              className="flex flex-col items-center justify-center h-9 w-9 p-0 rounded-full relative text-white bg-green-500 hover:bg-green-600"
              title={`Ваше предложение: $${pendingOffer.offered_price} (максимальное)`}
            >
              <Clock className="h-3 w-3 animate-spin mb-0.5" />
              <span className="text-[10px] font-bold leading-none">${pendingOffer.offered_price}</span>
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
              className="flex items-center gap-2 w-full h-9 text-xs px-3 text-white bg-green-500 hover:bg-green-600"
            >
              <Clock className="h-3 w-3 animate-spin" />
              <span className="font-medium">${pendingOffer.offered_price}</span>
              <span className="text-xs opacity-90">(лидирует)</span>
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

    // If user is NOT leading and there are other offers, show combined rectangular button
    if (maxOtherOffer > 0) {
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
              className="flex items-center h-9 px-2 text-white bg-orange-500 hover:bg-orange-600 relative overflow-hidden"
              title={`Максимальное: $${maxOtherOffer}, ваше: $${pendingOffer.offered_price}`}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span>${maxOtherOffer}</span>
                <div className="w-px h-4 bg-white/30 mx-1"></div>
                <Clock className="h-2.5 w-2.5 animate-spin" />
                <span>${pendingOffer.offered_price}</span>
              </div>
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
              className="flex items-center w-full h-9 text-xs px-3 text-white bg-orange-500 hover:bg-orange-600 relative overflow-hidden"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="opacity-90">другой ${maxOtherOffer}</span>
                <div className="w-px h-4 bg-white/30"></div>
                <Clock className="h-3 w-3 animate-spin" />
                <span className="font-medium">ваше ${pendingOffer.offered_price}</span>
                <span className="text-xs opacity-75 ml-auto">(обновить)</span>
              </div>
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

    // If user is NOT leading but no other offers, show orange button with user's offer
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
            className="flex flex-col items-center justify-center h-9 w-9 p-0 rounded-full relative text-white bg-orange-500 hover:bg-orange-600"
            title={`Ваше предложение: $${pendingOffer.offered_price}`}
          >
            <Clock className="h-3 w-3 animate-spin mb-0.5" />
            <span className="text-[10px] font-bold leading-none">${pendingOffer.offered_price}</span>
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
            className="flex items-center gap-2 w-full h-9 text-xs px-3 text-white bg-orange-500 hover:bg-orange-600"
          >
            <Clock className="h-3 w-3 animate-spin" />
            <span className="font-medium">${pendingOffer.offered_price}</span>
            <span className="text-xs opacity-90">(обновить)</span>
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
  return (
    <>
      <div className="flex items-center gap-2">
        {/* Show competitor badge if there are other offers */}
        {maxOtherOffer > 0 && (
          <CompetitorOfferBadge maxOtherOffer={maxOtherOffer} compact={compact} />
        )}
        
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
            className="flex items-center gap-2 w-full h-9 text-xs px-3"
          >
            <BidIcon className="h-3 w-3" />
            <span>Предложить</span>
          </Button>
        )}
      </div>

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
};
