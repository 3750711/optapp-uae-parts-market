import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Product } from '@/types/product';
import { useCreatePriceOffer } from '@/hooks/use-price-offers';
import { formatPrice } from '@/utils/formatPrice';
import { Loader2 } from 'lucide-react';
import { CreatePriceOfferData } from '@/types/price-offer';

interface EnhancedOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  isLeadingBid: boolean;
  maxOtherOffer: number;
  onOfferSuccess?: () => void; // Новый опциональный коллбэк
}

export const EnhancedOfferModal: React.FC<EnhancedOfferModalProps> = ({
  isOpen,
  onClose,
  product,
  isLeadingBid,
  maxOtherOffer,
  onOfferSuccess
}) => {
  const [offeredPrice, setOfferedPrice] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createOfferMutation = useCreatePriceOffer();

  useEffect(() => {
    // Сбрасываем состояние при открытии модального окна
    if (isOpen) {
      setOfferedPrice(undefined);
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offeredPrice || offeredPrice <= 0) {
      toast.error('Введите корректную цену');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const offerData: CreatePriceOfferData = {
        product_id: product.id,
        seller_id: product.seller_id,
        original_price: product.price,
        offered_price: offeredPrice,
        message: message.trim() || undefined,
      };

      console.log('📝 Creating offer with data:', offerData);
      
      await createOfferMutation.mutateAsync(offerData);
      
      // Вызываем коллбэк успешного создания предложения
      if (onOfferSuccess) {
        onOfferSuccess();
      } else {
        onClose();
      }
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Ошибка уже обработана в mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Предложить цену</DialogTitle>
          <DialogDescription>
            Предложите свою цену на этот товар.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Товар
            </Label>
            <Input 
              type="text" 
              id="name" 
              value={product.title} 
              className="col-span-3" 
              readOnly 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="originalPrice" className="text-right">
              Цена
            </Label>
            <Input
              type="text"
              id="originalPrice"
              value={formatPrice(product.price)}
              className="col-span-3"
              readOnly
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="offeredPrice" className="text-right">
              Ваша цена
            </Label>
            <Input
              type="number"
              id="offeredPrice"
              placeholder="Предложите свою цену"
              className="col-span-3"
              value={offeredPrice !== undefined ? offeredPrice : ''}
              onChange={(e) => setOfferedPrice(Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="message" className="text-right mt-2">
              Сообщение
            </Label>
            <Textarea
              id="message"
              placeholder="Дополнительное сообщение"
              className="col-span-3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                Отправка...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Предложить цену"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
