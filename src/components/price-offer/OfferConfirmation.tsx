
import React from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

interface OfferConfirmationProps {
  product: Product;
  offerPrice: number;
  deliveryMethod: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OfferConfirmation: React.FC<OfferConfirmationProps> = ({
  product,
  offerPrice,
  deliveryMethod,
  onConfirm,
  onCancel
}) => {
  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'courier': return 'Доставка курьером';
      case 'post': return 'Почтовая доставка';
      default: return 'Самовывоз';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          Подтверждение предложения
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          При принятии вашего предложения будет автоматически создан заказ
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Товар:</span>
          <span className="text-sm font-medium">{product.title}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Ваше предложение:</span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-600">${offerPrice}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Способ получения:</span>
          <span className="text-sm font-medium">{getDeliveryLabel(deliveryMethod)}</span>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Что произойдет при принятии:</p>
            <ul className="space-y-1 text-xs">
              <li>• Заказ будет создан автоматически</li>
              <li>• Товар будет забронирован за вами</li>
              <li>• Вы получите уведомление</li>
              <li>• Сможете связаться с продавцом</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Отмена
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          Подтверждаю
        </Button>
      </div>
    </div>
  );
};
