
import { useCallback } from 'react';
import { OrderFormData } from '@/components/admin/order/types';
import { supabase } from '@/integrations/supabase/client';
import { BuyerProfile, ValidationError } from './types';

export const useAdminOrderValidation = () => {
  const findBuyerByOptId = useCallback(async (optId: string): Promise<BuyerProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .eq('opt_id', optId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as BuyerProfile;
    } catch (error) {
      console.error('Error finding buyer:', error);
      return null;
    }
  }, []);

  const getSellerName = useCallback(async (sellerId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sellerId)
        .maybeSingle();

      if (error || !data) {
        return 'Unknown Seller';
      }

      return data.full_name || 'Unknown Seller';
    } catch (error) {
      console.error('Error getting seller name:', error);
      return 'Unknown Seller';
    }
  }, []);

  const validateForm = useCallback(async (formData: OrderFormData): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!formData.title?.trim()) {
      errors.push({ field: 'title', message: 'Название заказа обязательно' });
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push({ field: 'price', message: 'Цена должна быть больше 0' });
    }
    if (!formData.buyerOptId?.trim()) {
      errors.push({ field: 'buyerOptId', message: 'OPT_ID покупателя обязателен' });
    }

    // Validate buyer exists
    if (formData.buyerOptId?.trim()) {
      const buyer = await findBuyerByOptId(formData.buyerOptId.trim());
      if (!buyer) {
        errors.push({ field: 'buyerOptId', message: `Покупатель с OPT_ID "${formData.buyerOptId}" не найден` });
      }
    }

    // Validate seller if specified
    if (formData.sellerId) {
      const sellerName = await getSellerName(formData.sellerId);
      if (sellerName === 'Unknown Seller') {
        errors.push({ field: 'sellerId', message: 'Выбранный продавец не найден' });
      }
    }

    // Validate delivery method
    const validDeliveryMethods = ['self_pickup', 'delivery', 'cargo_rf'];
    if (!validDeliveryMethods.includes(formData.deliveryMethod)) {
      errors.push({ field: 'deliveryMethod', message: 'Некорректный способ доставки' });
    }

    return errors;
  }, [findBuyerByOptId, getSellerName]);

  return {
    validateForm,
    findBuyerByOptId,
    getSellerName
  };
};
