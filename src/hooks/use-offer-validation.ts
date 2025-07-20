
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OfferValidationResult {
  canCreateOffer: boolean;
  existingOffer?: {
    id: string;
    offered_price: number;
    status: string;
    expires_at: string;
    message?: string;
  };
  validationMessage?: string;
}

export const useOfferValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateOfferCreation = useCallback(async (
    productId: string,
    userId?: string
  ): Promise<OfferValidationResult> => {
    if (!userId) {
      return {
        canCreateOffer: false,
        validationMessage: "Пользователь не авторизован"
      };
    }

    setIsValidating(true);

    try {
      // Проверяем существующие активные предложения
      const { data: existingOffers, error } = await supabase
        .from('price_offers')
        .select('id, offered_price, status, expires_at, message')
        .eq('product_id', productId)
        .eq('buyer_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking existing offers:', error);
        return {
          canCreateOffer: false,
          validationMessage: "Ошибка при проверке существующих предложений"
        };
      }

      // Проверяем, есть ли активное предложение
      const activeOffer = existingOffers?.[0];
      
      if (activeOffer) {
        // Проверяем, не истекло ли предложение
        const isExpired = new Date(activeOffer.expires_at) < new Date();
        
        if (isExpired) {
          // Автоматически обновляем статус истекшего предложения
          await supabase
            .from('price_offers')
            .update({ status: 'expired' })
            .eq('id', activeOffer.id);

          return {
            canCreateOffer: true,
            validationMessage: "Предыдущее предложение истекло, можно создать новое"
          };
        }

        return {
          canCreateOffer: false,
          existingOffer: activeOffer,
          validationMessage: "У вас уже есть активное предложение для этого товара"
        };
      }

      return {
        canCreateOffer: true,
        validationMessage: "Можно создать новое предложение"
      };

    } catch (error) {
      console.error('Validation error:', error);
      return {
        canCreateOffer: false,
        validationMessage: "Произошла ошибка при валидации"
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const cancelExistingOffer = useCallback(async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('price_offers')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: "Предложение отменено",
        description: "Ваше предыдущее предложение было отменено",
      });

      return true;
    } catch (error) {
      console.error('Error cancelling offer:', error);
      toast({
        title: "Ошибка отмены",
        description: "Не удалось отменить предложение",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    validateOfferCreation,
    cancelExistingOffer,
    isValidating
  };
};
