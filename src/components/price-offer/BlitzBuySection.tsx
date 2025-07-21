
import React from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Zap, DollarSign, ShoppingCart } from 'lucide-react';

interface BlitzBuySectionProps {
  product: Product;
  onBuy: () => void;
  isSubmitting: boolean;
}

export const BlitzBuySection: React.FC<BlitzBuySectionProps> = ({
  product,
  onBuy,
  isSubmitting
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-800">
            Мгновенная покупка
          </h3>
        </div>
        
        <p className="text-sm text-yellow-700 mb-3">
          Купите товар по полной цене без ожидания. Заказ будет создан мгновенно.
        </p>
        
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <span className="text-sm font-medium text-gray-700">
            Цена товара:
          </span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              ${product.price}
            </span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">Что произойдет:</p>
              <ul className="mt-1 space-y-1">
                <li>• Заказ создастся мгновенно</li>
                <li>• Товар будет забронирован за вами</li>
                <li>• Продавец получит уведомление</li>
                <li>• Вы сможете выбрать способ получения</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <Button
        onClick={onBuy}
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold h-12"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Оформление...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Купить за ${product.price}
          </div>
        )}
      </Button>
    </div>
  );
};
