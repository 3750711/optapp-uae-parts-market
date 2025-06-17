
import { useCallback } from 'react';
import { OrderFormData } from '@/components/admin/order/types';
import { supabase } from '@/integrations/supabase/client';
import { BuyerProfile, ValidationError } from './types';

// Функция нормализации OPT_ID
const normalizeOptId = (optId: string): string => {
  return optId.trim().toUpperCase().replace(/\s+/g, '');
};

export const useAdminOrderValidation = () => {
  const findBuyerByOptId = useCallback(async (optId: string): Promise<BuyerProfile | null> => {
    try {
      const normalizedOptId = normalizeOptId(optId);
      console.log('🔍 Searching for buyer with OPT_ID:', { original: optId, normalized: normalizedOptId });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .ilike('opt_id', normalizedOptId) // Поиск без учета регистра
        .maybeSingle();

      if (error) {
        console.error('❌ Error finding buyer:', error);
        return null;
      }

      if (!data) {
        console.log('⚠️ No buyer found with OPT_ID:', normalizedOptId);
        return null;
      }

      console.log('✅ Buyer found:', data);
      return data as BuyerProfile;
    } catch (error) {
      console.error('❌ Exception in findBuyerByOptId:', error);
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

  const validateForm = useCallback(async (formData: OrderFormData): Promise<{ errors: ValidationError[], buyer: BuyerProfile | null }> => {
    const errors: ValidationError[] = [];
    let buyer: BuyerProfile | null = null;

    console.log('🔄 Starting form validation with data:', formData);

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

    // Validate buyer exists и сохраняем найденного покупателя
    if (formData.buyerOptId?.trim()) {
      buyer = await findBuyerByOptId(formData.buyerOptId.trim());
      if (!buyer) {
        const normalizedOptId = normalizeOptId(formData.buyerOptId.trim());
        errors.push({ 
          field: 'buyerOptId', 
          message: `Покупатель с OPT_ID "${normalizedOptId}" не найден` 
        });
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
    const validDeliveryMethods = ['self_pickup', 'cargo_rf', 'cargo_kz'];
    if (!validDeliveryMethods.includes(formData.deliveryMethod)) {
      errors.push({ field: 'deliveryMethod', message: 'Некорректный способ доставки' });
    }

    console.log('✅ Validation completed:', { errorsCount: errors.length, buyerFound: !!buyer });
    
    return { errors, buyer };
  }, [findBuyerByOptId, getSellerName]);

  return {
    validateForm,
    findBuyerByOptId,
    getSellerName
  };
};
