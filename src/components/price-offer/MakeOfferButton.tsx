import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HandCoins } from "lucide-react";
import { MakeOfferModal } from "./MakeOfferModal";
import { useCheckPendingOffer } from "@/hooks/use-price-offers";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface MakeOfferButtonProps {
  productId: string;
  sellerId: string;
  currentPrice: number;
  productTitle: string;
  disabled?: boolean;
}

export const MakeOfferButton = ({
  productId,
  sellerId,
  currentPrice,
  productTitle,
  disabled = false,
}: MakeOfferButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { data: pendingOffer } = useCheckPendingOffer(productId, !!user);

  // Don't show button if user is the seller or not a buyer
  if (!user || !profile || profile.user_type !== "buyer" || profile.id === sellerId) {
    return null;
  }

  // If user has pending offer, show status instead
  if (pendingOffer) {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="text-sm">
          Ваше предложение: ₽{pendingOffer.offered_price}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Ожидает ответа
        </Badge>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <HandCoins className="h-4 w-4" />
        Предложить цену
      </Button>

      <MakeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        sellerId={sellerId}
        currentPrice={currentPrice}
        productTitle={productTitle}
      />
    </>
  );
};