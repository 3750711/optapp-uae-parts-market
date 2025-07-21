import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MobileKeyboardOptimizedDialog } from '@/components/ui/MobileKeyboardOptimizedDialog';
import { useCreatePriceOffer, useUpdatePriceOffer } from '@/hooks/use-price-offers';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { PriceOffer } from '@/types/price-offer';
import { useProductImage } from '@/hooks/useProductImage';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Clock, Send } from 'lucide-react';

const offerSchema = z.object({
  offered_price: z.number().min(1, 'Цена должна быть больше 0'),
  message: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface NewMakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  existingOffer?: PriceOffer;
}

export const NewMakeOfferModal: React.FC<NewMakeOfferModalProps> = ({
  isOpen,
  onClose,
  product,
  existingOffer
}) => {
  const { user } = useAuth();
  const { primaryImage } = useProductImage(product);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createOfferMutation = useCreatePriceOffer();
  const updateOfferMutation = useUpdatePriceOffer();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offered_price: existingOffer?.offered_price || 0,
      message: existingOffer?.message || '',
    }
  });

  const watchedPrice = watch('offered_price');

  // Reset form when modal opens/closes or offer changes
  useEffect(() => {
    if (isOpen) {
      reset({
        offered_price: existingOffer?.offered_price || 0,
        message: existingOffer?.message || '',
      });
    }
  }, [isOpen, existingOffer, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: OfferFormData) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (existingOffer) {
        await updateOfferMutation.mutateAsync({
          offerId: existingOffer.id,
          data: {
            offered_price: data.offered_price,
            message: data.message || undefined,
          }
        });
      } else {
        await createOfferMutation.mutateAsync({
          product_id: product.id,
          seller_id: product.seller_id,
          original_price: product.price,
          offered_price: data.offered_price,
          message: data.message || undefined,
        });
      }
      
      handleClose();
    } catch (error) {
      console.error('Error submitting offer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceQuickSet = (percentage: number) => {
    const newPrice = Math.round(product.price * percentage);
    setValue('offered_price', newPrice);
  };

  const getPriceComparisonColor = () => {
    if (!watchedPrice) return 'text-gray-500';
    if (watchedPrice >= product.price) return 'text-green-600';
    if (watchedPrice >= product.price * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriceComparisonText = () => {
    if (!watchedPrice) return 'Введите цену';
    const diff = watchedPrice - product.price;
    const percentage = ((watchedPrice / product.price) * 100).toFixed(0);
    
    if (diff > 0) {
      return `+$${diff} (${percentage}% от цены)`;
    } else if (diff < 0) {
      return `$${diff} (${percentage}% от цены)`;
    } else {
      return 'Равна цене товара';
    }
  };

  return (
    <MobileKeyboardOptimizedDialog
      open={isOpen}
      onOpenChange={handleClose}
      title={existingOffer ? 'Обновить предложение' : 'Предложить цену'}
      className="max-w-md"
    >
      <div className="space-y-4">
        {/* Product Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <img
            src={primaryImage}
            alt={product.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {product.title}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {product.brand} {product.model}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <DollarSign className="w-3 h-3 text-green-600" />
              <span className="text-sm font-semibold text-green-600">
                ${product.price}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Offer Status */}
        {existingOffer && (
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Ваше текущее предложение: ${existingOffer.offered_price}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Статус: {existingOffer.status === 'pending' ? 'Ожидает ответа' : existingOffer.status}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Price Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Ваше предложение
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...register('offered_price', { valueAsNumber: true })}
                type="number"
                placeholder="0"
                className={cn(
                  "pl-8 text-lg font-medium",
                  errors.offered_price && "border-red-500"
                )}
                min="1"
                step="1"
              />
            </div>
            {errors.offered_price && (
              <p className="text-sm text-red-600">{errors.offered_price.message}</p>
            )}
            
            {/* Price Comparison */}
            <div className={cn("text-sm font-medium", getPriceComparisonColor())}>
              {getPriceComparisonText()}
            </div>
          </div>

          {/* Quick Price Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Быстрый выбор цены
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0.7, 0.8, 0.9, 1.0].map((percentage) => (
                <Button
                  key={percentage}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePriceQuickSet(percentage)}
                  className="text-xs h-8"
                >
                  {(percentage * 100).toFixed(0)}%
                </Button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Сообщение продавцу (необязательно)
            </label>
            <Textarea
              {...register('message')}
              placeholder="Добавьте комментарий к вашему предложению..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              disabled={isSubmitting || !watchedPrice || watchedPrice <= 0}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Отправка...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {existingOffer ? 'Обновить' : 'Отправить'}
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Info Section */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium">Как работают предложения:</p>
              <ul className="mt-1 space-y-1">
                <li>• Предложения действуют 6 часов</li>
                <li>• Продавец может принять или отклонить</li>
                <li>• При принятии создается заказ по вашей цене</li>
                <li>• Другие покупатели видят максимальную цену</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MobileKeyboardOptimizedDialog>
  );
};
