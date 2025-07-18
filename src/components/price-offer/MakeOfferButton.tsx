import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HandCoins, Clock } from "lucide-react";
import { MakeOfferModal } from "./MakeOfferModal";
import { useCheckPendingOffer } from "@/hooks/use-price-offers";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface MakeOfferButtonProps {
  product: Product;
  disabled?: boolean;
}

// Add Product import
import { Product } from "@/types/product";

export const MakeOfferButton = ({
  product,
  disabled = false,
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
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className="flex items-center gap-2 w-full"
        >
          <Clock className="h-4 w-4 animate-pulse" />
          ₽{pendingOffer.offered_price} - Ожидает ответа
        </Button>

        <MakeOfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          existingOffer={pendingOffer}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 w-full"
      >
        <HandCoins className="h-4 w-4" />
        Предложить цену
      </Button>

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
};