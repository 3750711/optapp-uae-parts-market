
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Info, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Product } from '@/types/product';
import { useSimpleCreateOffer } from '@/hooks/use-simple-price-offers';
import { useIsMobile } from '@/hooks/use-mobile';

interface SimpleOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  currentOffer?: number;
  maxOffer?: number;
}

interface FormData {
  offered_price: string;
  message: string;
}

export const SimpleOfferModal: React.FC<SimpleOfferModalProps> = ({
  isOpen,
  onClose,
  product,
  currentOffer,
  maxOffer = 0
}) => {
  const isMobile = useIsMobile();
  const createOfferMutation = useSimpleCreateOffer();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<FormData>({
    defaultValues: {
      offered_price: currentOffer?.toString() || "",
      message: ""
    }
  });

  const watchedPrice = watch("offered_price");
  const priceValue = parseFloat(watchedPrice) || 0;

  const onSubmit = async (data: FormData) => {
    const offeredPrice = parseFloat(data.offered_price);
    
    if (isNaN(offeredPrice) || offeredPrice <= 0) {
      return;
    }

    try {
      await createOfferMutation.mutateAsync({
        product_id: product.id,
        seller_id: product.seller_id,
        original_price: product.price,
        offered_price: offeredPrice,
        message: data.message || undefined
      });
      
      handleClose();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const minPrice = Math.max(maxOffer + 1, 1);
  const isUpdate = !!currentOffer;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-lg ${isMobile ? 'mx-4' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {isUpdate ? 'Обновить предложение' : 'Предложить цену'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Информация о товаре */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold text-sm">{product.title}</p>
            <p className="text-sm text-muted-foreground">
              Цена продавца: <span className="font-semibold">${product.price}</span>
            </p>
          </div>

          {/* Информация о текущих предложениях */}
          {maxOffer > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {currentOffer ? (
                  <>
                    Ваше текущее предложение: <strong>${currentOffer}</strong>
                    {maxOffer > currentOffer && (
                      <span className="text-orange-600">
                        {' '}• Максимальное предложение: <strong>${maxOffer}</strong>
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Максимальное предложение: <strong>${maxOffer}</strong>
                    <br />
                    Ваше предложение должно быть больше ${maxOffer}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="offered_price">
                {isUpdate ? 'Новая цена' : 'Ваше предложение'} *
              </Label>
              <Input
                id="offered_price"
                type="number"
                step="1"
                min={isUpdate ? "1" : minPrice}
                max={product.price}
                placeholder={`${isUpdate ? 'Обновить до' : 'Минимум'} $${minPrice}`}
                {...register("offered_price", {
                  required: "Введите предлагаемую цену",
                  min: { 
                    value: isUpdate ? 1 : minPrice, 
                    message: isUpdate 
                      ? "Цена должна быть больше 0" 
                      : `Предложение должно быть больше $${maxOffer}` 
                  },
                  max: { 
                    value: product.price, 
                    message: `Цена не может быть больше $${product.price}` 
                  }
                })}
              />
              {errors.offered_price && (
                <p className="text-sm text-destructive mt-1">
                  {errors.offered_price.message}
                </p>
              )}
              
              {/* Показываем статус предложения */}
              {priceValue > 0 && (
                <p className="text-sm mt-1">
                  {priceValue <= maxOffer ? (
                    <span className="text-orange-600">
                      Ваше предложение должно быть больше ${maxOffer}
                    </span>
                  ) : priceValue >= product.price ? (
                    <span className="text-green-600">
                      Вы предлагаете полную цену продавца
                    </span>
                  ) : (
                    <span className="text-blue-600">
                      Ваше предложение будет лидировать
                    </span>
                  )}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="message">
                Сообщение продавцу (необязательно)
              </Label>
              <Textarea
                id="message"
                placeholder="Дополнительная информация или обоснование цены..."
                rows={3}
                {...register("message")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createOfferMutation.isPending}
                className="flex-1"
              >
                Отменить
              </Button>
              <Button
                type="submit"
                disabled={createOfferMutation.isPending}
                className="flex-1"
              >
                {createOfferMutation.isPending 
                  ? 'Отправка...' 
                  : isUpdate 
                    ? 'Обновить' 
                    : 'Отправить'
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
