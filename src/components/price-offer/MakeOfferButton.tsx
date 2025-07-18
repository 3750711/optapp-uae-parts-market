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

// Кастомная иконка с надписью BID
const BidIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    className={className}
  >
    {/* Прямоугольник с закругленными углами */}
    <rect x="3" y="6" width="18" height="12" rx="3" ry="3" fill="none" stroke="currentColor" />
    {/* Текст BID */}
    <text 
      x="12" 
      y="13.5" 
      textAnchor="middle" 
      fontSize="6" 
      fontWeight="bold" 
      fill="currentColor" 
      stroke="none"
    >
      BID
    </text>
  </svg>
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
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className={compact 
            ? "flex items-center justify-center h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 text-white rounded-full relative"
            : "flex items-center gap-1 w-full h-9 text-xs px-2 bg-orange-500 hover:bg-orange-600 text-white"
          }
          title={compact ? `Ваше предложение: $${pendingOffer.offered_price}` : undefined}
        >
          <Clock className={compact ? "h-3 w-3 animate-spin" : "h-3 w-3 animate-spin"} />
          {!compact && `$${pendingOffer.offered_price}`}
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
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={compact 
          ? "flex items-center justify-center h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
          : "flex items-center gap-1 w-full h-9 text-xs px-2"
        }
        title={compact ? "Предложить цену" : undefined}
      >
        <BidIcon className={compact ? "h-4 w-4 text-primary" : "h-3 w-3"} />
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