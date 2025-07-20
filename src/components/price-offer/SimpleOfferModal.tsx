
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign } from 'lucide-react';
import { Product } from '@/types/product';
import { useSimpleCreateOffer } from '@/hooks/use-simple-price-offers';
import { formatPrice } from '@/utils/formatPrice';

interface SimpleOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  currentOffer?: number;
  maxOffer?: number;
}

export const SimpleOfferModal: React.FC<SimpleOfferModalProps> = ({
  isOpen,
  onClose,
  product,
  currentOffer,
  maxOffer = 0
}) => {
  const [offerPrice, setOfferPrice] = useState(0);
  const [message, setMessage] = useState('');
  const createOfferMutation = useSimpleCreateOffer();

  // Инициализируем значение при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      const initialPrice = currentOffer || Math.max(maxOffer + 1, Math.floor(product.price * 0.7));
      setOfferPrice(initialPrice);
      console.log('🏷️ Modal opened with initial price:', initialPrice, {
        currentOffer,
        maxOffer,
        productPrice: product.price
      });
    }
  }, [isOpen, currentOffer, maxOffer, product.price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Submitting offer:', {
      offerPrice,
      currentOffer,
      maxOffer,
      message: message.trim()
    });
    
    const minPrice = Math.max(currentOffer ? currentOffer + 1 : maxOffer + 1, 1);
    
    if (offerPrice < minPrice && !currentOffer) {
      console.warn('⚠️ Offer price too low:', offerPrice, 'min required:', minPrice);
      return;
    }

    try {
      await createOfferMutation.mutateAsync({
        product_id: product.id,
        seller_id: product.seller_id,
        original_price: product.price,
        offered_price: offerPrice,
        message: message.trim() || undefined
      });
      
      console.log('✅ Offer submitted successfully');
      onClose();
      setMessage(''); // Очищаем сообщение после успешной отправки
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  const minPrice = Math.max(currentOffer ? currentOffer : maxOffer + 1, 1);
  const isValidPrice = offerPrice >= minPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {currentOffer ? 'Обновить предложение' : 'Предложить цену'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Информация о товаре */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1">{product.title}</h4>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Цена продавца: {formatPrice(product.price)}</span>
              {maxOffer > 0 && (
                <span>Макс. предложение: ${maxOffer}</span>
              )}
            </div>
            {currentOffer && (
              <div className="text-xs text-blue-600 mt-1">
                Ваше текущее предложение: ${currentOffer}
              </div>
            )}
          </div>

          {/* Поле цены */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Ваше предложение
              {currentOffer && (
                <span className="text-xs text-gray-500 ml-1">
                  (текущее: ${currentOffer})
                </span>
              )}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="price"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                className="pl-10"
                placeholder="Введите сумму"
                min={minPrice}
                step="1"
                required
              />
            </div>
            {!isValidPrice && (
              <p className="text-xs text-red-600">
                {currentOffer 
                  ? `Новое предложение должно быть больше текущего: $${currentOffer}`
                  : `Минимальная сумма: $${minPrice}`
                }
              </p>
            )}
          </div>

          {/* Сообщение */}
          <div className="space-y-2">
            <Label htmlFor="message">Сообщение (необязательно)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Добавьте комментарий к вашему предложению..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createOfferMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValidPrice || createOfferMutation.isPending}
            >
              {createOfferMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {currentOffer ? 'Обновить' : 'Отправить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
