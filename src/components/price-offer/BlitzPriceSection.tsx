
import React from 'react';
import { Zap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlitzPriceSectionProps {
  price: number;
  onBuyNow: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const BlitzPriceSection: React.FC<BlitzPriceSectionProps> = ({
  price,
  onBuyNow,
  disabled = false,
  compact = false
}) => {
  if (compact) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 shadow-lg relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-yellow-100/50 animate-pulse" />
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-300/20 to-amber-300/20 rounded-full -translate-y-10 translate-x-10" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-amber-500 rounded-lg shadow-md">
            <Zap className="h-5 w-5 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-amber-900">Blitz цена</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-amber-900 mb-2">
            ${price.toLocaleString()}
          </div>
          <Button
            onClick={onBuyNow}
            disabled={disabled}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-6 h-11"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Купить сейчас за ${price}
          </Button>
        </div>
        
        <p className="text-amber-700 text-xs mt-2 flex items-center gap-1">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          Мгновенная покупка по текущей цене
        </p>
      </div>
    </div>
  );
};
