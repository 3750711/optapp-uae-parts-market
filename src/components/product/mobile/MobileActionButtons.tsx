import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, HandCoins, ShoppingCart } from "lucide-react";
import { Product } from "@/types/product";

interface MobileActionButtonsProps {
  product: Product;
  onContactSeller: () => void;
  onMakeOffer: () => void;
  onBuyNow: () => void;
}

const MobileActionButtons: React.FC<MobileActionButtonsProps> = ({
  product,
  onContactSeller,
  onMakeOffer,
  onBuyNow,
}) => {
  return (
    <div className="bg-white p-4 border-b border-gray-100">
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onContactSeller}
          className="flex items-center gap-1 text-xs"
        >
          <MessageCircle className="h-3 w-3" />
          Связь
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onMakeOffer}
          className="flex items-center gap-1 text-xs"
        >
          <HandCoins className="h-3 w-3" />
          Предложить
        </Button>
        
        <Button 
          size="sm"
          onClick={onBuyNow}
          className="flex items-center gap-1 text-xs bg-primary hover:bg-primary/90"
        >
          <ShoppingCart className="h-3 w-3" />
          Купить ${product.price}
        </Button>
      </div>
    </div>
  );
};

export default MobileActionButtons;