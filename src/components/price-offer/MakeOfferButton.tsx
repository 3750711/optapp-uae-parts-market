import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { MakeOfferModal } from "./MakeOfferModal";
import { useCheckPendingOffer } from "@/hooks/use-price-offers";
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

  // Show button only for buyers and admins, but not for the seller
  if (!user || !profile || profile.id === product.seller_id) {
    return null;
  }

  // Only show for buyers and admins
  if (profile.user_type !== "buyer" && !hasAdminAccess) {
    return null;
  }

  // If user has pending offer, show button with waiting animation
  if (pendingOffer) {
    return (
      <>
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsModalOpen(true);
          }}
          disabled={disabled}
          className={compact 
            ? "flex items-center justify-center h-9 w-9 p-0 bg-orange-500 hover:bg-orange-600 text-white rounded-full relative"
            : "flex items-center gap-1 w-full h-9 text-xs px-2 bg-orange-500 hover:bg-orange-600 text-white"
          }
          title={compact ? `Ваше предложение: $${pendingOffer.offered_price}` : undefined}
        >
          {compact ? (
            <div className="flex flex-col items-center justify-center">
              <Clock className="h-1.5 w-1.5 animate-spin mb-0.5" />
              <span className="text-[10px] font-bold leading-none">${pendingOffer.offered_price}</span>
            </div>
          ) : (
            <>
              <Clock className="h-3 w-3 animate-spin" />
              ${pendingOffer.offered_price}
            </>
          )}
        </Button>

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

  return (
    <>
      <Button
        variant={compact ? "ghost" : "outline"}
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsModalOpen(true);
        }}
        disabled={disabled}
        className={compact 
          ? "flex items-center justify-center h-9 w-9 p-0 hover:bg-primary/10 rounded-full"
          : "flex items-center gap-1 w-full h-9 text-xs px-2"
        }
        title={compact ? "Предложить цену" : undefined}
      >
        <BidIcon className={compact ? "h-5 w-5" : "h-3 w-3"} />
        {!compact && "Предложить"}
      </Button>

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
};