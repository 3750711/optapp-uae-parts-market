import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types/product";

interface MobileStickyBuyButtonProps {
  product: Product;
  onBuyNow: () => void;
}

const MobileStickyBuyButton: React.FC<MobileStickyBuyButtonProps> = ({
  product,
  onBuyNow,
}) => {
  // Don't show button if product is sold or archived
  if (product.status === 'sold' || product.status === 'archived') {
    return null;
  }

  return (
    <div className="pwa-safe-fixed-bottom bg-white border-t border-gray-200 p-4">
      <Button 
        onClick={onBuyNow}
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-base h-12"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Купить за ${product.price}
      </Button>
    </div>
  );
};

export default MobileStickyBuyButton;