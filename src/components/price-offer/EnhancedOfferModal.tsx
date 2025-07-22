import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useCreatePriceOffer, useUpdatePriceOffer } from '@/hooks/use-price-offers';
import { useAuth } from '@/contexts/AuthContext';
import { useOfferContext } from '@/contexts/OfferContext';
import { Product } from '@/types/product';
import { PriceOffer } from '@/types/price-offer';
import { useProductImage } from '@/hooks/useProductImage';
import { cn } from '@/lib/utils';
import { DollarSign, Clock, CheckCircle, AlertCircle, X, Send, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OfferStatusIndicator } from './OfferStatusIndicator';
import { BlitzBuySection } from './BlitzBuySection';
import { DeliveryMethodPicker } from './DeliveryMethodPicker';
import { OfferConfirmation } from './OfferConfirmation';

// Динамическая схема валидации в зависимости от контекста
const createOfferSchema = (existingOffer?: any) => z.object({
  offered_price: existingOffer 
    ? z.number().min(existingOffer.offered_price + 1, `Цена должна быть больше текущей ставки $${existingOffer.offered_price}`)
    : z.number().min(1, 'Цена должна быть больше 0'),
  message: z.string().optional(),
  delivery_method: z.enum(['self_pickup', 'cargo_rf', 'cargo_kz']).default('cargo_rf'),
  create_order_confirmed: z.boolean().default(false),
});

type OfferFormData = z.infer<ReturnType<typeof createOfferSchema>>;

interface EnhancedOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  existingOffer?: PriceOffer;
  isLeadingBid?: boolean;
  maxOtherOffer?: number;
}

export const EnhancedOfferModal: React.FC<EnhancedOfferModalProps> = ({
  isOpen,
  onClose,
  product,
  existingOffer,
  isLeadingBid = false,
  maxOtherOffer = 0
}) => {
  const { user } = useAuth();
  const { primaryImage } = useProductImage(product);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'offer' | 'blitz'>('offer');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { setOfferState, setProcessing, forceRefresh } = useOfferContext();
  
  const createOfferMutation = useCreatePriceOffer();
  const updateOfferMutation = useUpdatePriceOffer();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues
  } = useForm<OfferFormData>({
    resolver: zodResolver(createOfferSchema(existingOffer)),
    defaultValues: {
      offered_price: existingOffer?.offered_price || Math.floor(product.price * 0.8),
      message: existingOffer?.message || '',
      delivery_method: 'cargo_rf',
      create_order_confirmed: false,
    }
  });

  const watchedPrice = watch('offered_price');

  useEffect(() => {
    if (isOpen) {
      reset({
        offered_price: existingOffer?.offered_price || Math.floor(product.price * 0.8),
        message: existingOffer?.message || '',
        delivery_method: 'cargo_rf',
        create_order_confirmed: false,
      });
    }
  }, [isOpen, existingOffer, reset]);

  const handleClose = () => {
    console.log('🎯 EnhancedOfferModal: Closing modal');
    setMode('offer');
    setShowConfirmation(false);
    reset();
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const onSubmit = async (data: OfferFormData) => {
    console.log('🎯 EnhancedOfferModal: Form submitted', { data, user: user?.id, mode });
    
    if (!user || isSubmitting) {
      console.log('🎯 EnhancedOfferModal: Submission blocked', { user: !!user, isSubmitting });
      return;
    }

    // Для первой ставки показываем подтверждение
    if (!existingOffer && !data.create_order_confirmed) {
      setShowConfirmation(true);
      return;
    }

    setIsSubmitting(true);
    
    // Optimistic update - immediately show processing state
    setProcessing(product.id, true);

    try {
      if (mode === 'blitz') {
        // Логика мгновенной покупки - создание заказа
        console.log('🎯 EnhancedOfferModal: Creating blitz order');
        // TODO: Implement blitz buy logic
        handleClose();
        return;
      }

      if (existingOffer) {
        console.log('🎯 EnhancedOfferModal: Updating existing offer', existingOffer.id);
        await updateOfferMutation.mutateAsync({
          offerId: existingOffer.id,
          data: {
            offered_price: Number(data.offered_price),
            // При обновлении не передаем message и delivery_method - они остаются неизменными
          }
        });
      } else {
        console.log('🎯 EnhancedOfferModal: Creating new offer');
        
        // Optimistic update - immediately show that offers are active
        setOfferState(product.id, true);
        
        await createOfferMutation.mutateAsync({
          product_id: product.id,
          seller_id: product.seller_id,
          original_price: product.price,
          offered_price: Number(data.offered_price),
          message: data.message || undefined,
        });
      }
      
      console.log('🎯 EnhancedOfferModal: Offer processed successfully');
      
      // Force refresh the product data to ensure everything is in sync
      forceRefresh(product.id);
      
      handleClose();
    } catch (error) {
      console.error('🎯 EnhancedOfferModal: Error submitting offer:', error);
      
      // Revert optimistic updates on error
      setOfferState(product.id, product.has_active_offers || false);
    } finally {
      setIsSubmitting(false);
      setProcessing(product.id, false);
    }
  };


  const getPriceColor = () => {
    if (watchedPrice >= product.price) return 'text-green-600';
    if (watchedPrice >= product.price * 0.8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getExpirationTime = () => {
    if (!existingOffer) return null;
    const expiresAt = new Date(existingOffer.expires_at);
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Истекло';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  };

  if (showConfirmation) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent 
          className="max-w-md mx-auto"
          onClick={handleModalClick}
        >
          <OfferConfirmation
            product={product}
            offerPrice={watchedPrice}
            deliveryMethod={getValues('delivery_method')}
            onConfirm={() => {
              setValue('create_order_confirmed', true);
              setShowConfirmation(false);
              handleSubmit(onSubmit)();
            }}
            onCancel={() => setShowConfirmation(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent 
          className="max-w-md mx-auto max-h-[95vh] overflow-hidden flex flex-col"
          onClick={handleModalClick}
        >
        <div onClick={handleBackdropClick} className="absolute inset-0 -z-10" />
        
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            {mode === 'offer' ? (
              <>
                <DollarSign className="w-5 h-5 text-primary" />
                {existingOffer ? 'Обновить предложение' : 'Предложить цену'}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-yellow-500" />
                Купить сейчас
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {/* Product Info */}
          <div 
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/catalog/${product.id}`;
            }}
          >
            <img
              src={primaryImage}
              alt={product.title}
              className="w-14 h-14 object-cover rounded-lg"
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
            <OfferStatusIndicator
              currentOffer={existingOffer}
              isLeading={isLeadingBid}
              maxOtherOffer={maxOtherOffer}
              timeLeft={getExpirationTime()}
            />
          )}

          {/* Mode Toggle */}
          <div className="flex rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setMode('offer')}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                mode === 'offer' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Предложить цену
            </button>
            <button
              type="button"
              onClick={() => setMode('blitz')}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                mode === 'blitz' 
                  ? 'bg-yellow-500 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Купить сейчас
            </button>
          </div>

          {mode === 'blitz' ? (
            <BlitzBuySection
              product={product}
              onBuy={() => {
                setValue('offered_price', product.price);
                handleSubmit(onSubmit)();
              }}
              isSubmitting={isSubmitting}
            />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Price Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Ваше предложение
                </label>

                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    {...register('offered_price', { valueAsNumber: true })}
                    type="number"
                    placeholder={existingOffer ? `Больше $${existingOffer.offered_price}` : "Любая цена"}
                    className={cn(
                      "pl-8 text-lg font-medium",
                      errors.offered_price && "border-red-500"
                    )}
                    min={1}
                    step="1"
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {existingOffer 
                      ? `Минимум: $${existingOffer.offered_price + 1}` 
                      : 'Минимум: $1'
                    }
                  </span>
                  <span className={cn("font-medium", getPriceColor())}>
                    Текущее: ${watchedPrice || 0}
                  </span>
                </div>
                
                {errors.offered_price && (
                  <p className="text-sm text-red-600">{errors.offered_price.message}</p>
                )}
              </div>

              {/* Delivery Method - only show when creating new offer */}
              {!existingOffer && (
                <DeliveryMethodPicker
                  value={watch('delivery_method')}
                  onChange={(value) => setValue('delivery_method', value)}
                  productPrice={product.price}
                />
              )}

              {/* Message - only show when creating new offer */}
              {!existingOffer && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Сообщение продавцу
                  </label>
                  <Textarea
                    {...register('message')}
                    placeholder="Добавьте комментарий к вашему предложению..."
                    className="min-h-[80px] resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {watch('message')?.length || 0}/500
                  </div>
                </div>
              )}

              {/* Show existing delivery method and message when updating */}
              {existingOffer && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  {existingOffer.message && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Сообщение: </span>
                      <span className="text-gray-600">"{existingOffer.message}"</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Способ доставки и сообщение остаются неизменными при обновлении предложения
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
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
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
