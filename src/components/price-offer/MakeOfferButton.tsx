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

// Иконка руки с деньгами
const HandMoneyIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Рука */}
    <path d="M11 17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1" />
    <path d="M11 17V8a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1z" />
    <path d="M7 7V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
    
    {/* Монеты */}
    <circle cx="18" cy="6" r="2" fill="currentColor" opacity="0.7" />
    <circle cx="20" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
    <circle cx="16" cy="8" r="1" fill="currentColor" opacity="0.6" />
    
    {/* Символ доллара на главной монете */}
    <text x="18" y="7" textAnchor="middle" fontSize="2" fontWeight="bold" fill="white">$</text>
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
        <HandMoneyIcon className={compact ? "h-4 w-4 text-primary" : "h-3 w-3"} />
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