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
          variant="default"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className="flex items-center justify-center h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 text-white rounded-full relative"
          title={`Ваше предложение: $${pendingOffer.offered_price}`}
        >
          <Clock className="h-3 w-3 animate-spin" />
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
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="flex items-center justify-center h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
        title="Предложить цену"
      >
        <HandCoins className="h-4 w-4 text-primary" />
      </Button>

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
};