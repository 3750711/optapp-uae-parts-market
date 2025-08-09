import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Share2, PencilLine } from "lucide-react";

interface MobileStoreStickyActionsProps {
  phone?: string | null;
  whatsapp?: string | null;
  onShare: () => void;
  onWriteReview: () => void;
}

const MobileStoreStickyActions: React.FC<MobileStoreStickyActionsProps> = ({
  phone,
  whatsapp,
  onShare,
  onWriteReview,
}) => {
  const normalizedPhone = phone ? phone.toString().replace(/[^\d+]/g, "") : null;
  const normalizedWhatsapp = whatsapp ? whatsapp.toString().replace(/\D/g, "") : null;

  const handleCall = () => {
    if (!normalizedPhone) return;
    window.location.href = `tel:${normalizedPhone}`;
  };

  const handleWhatsApp = () => {
    if (!normalizedWhatsapp) return;
    const waUrl = `https://wa.me/${normalizedWhatsapp}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 p-3 pb-safe">
      <div className="max-w-sm mx-auto grid grid-cols-4 gap-2">
        {normalizedPhone && (
          <Button
            variant="secondary"
            className="h-12 flex flex-col items-center justify-center"
            onClick={handleCall}
            aria-label="Позвонить"
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs mt-1">Позвонить</span>
          </Button>
        )}

        {normalizedWhatsapp && (
          <Button
            variant="secondary"
            className="h-12 flex flex-col items-center justify-center"
            onClick={handleWhatsApp}
            aria-label="Написать в WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs mt-1">WhatsApp</span>
          </Button>
        )}

        <Button
          variant="secondary"
          className="h-12 flex flex-col items-center justify-center"
          onClick={onShare}
          aria-label="Поделиться"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-xs mt-1">Поделиться</span>
        </Button>

        <Button
          className="h-12 flex flex-col items-center justify-center"
          onClick={onWriteReview}
          aria-label="Написать отзыв"
        >
          <PencilLine className="h-5 w-5" />
          <span className="text-xs mt-1">Отзыв</span>
        </Button>
      </div>
    </div>
  );
};

export default MobileStoreStickyActions;
