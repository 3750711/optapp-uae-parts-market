
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrderFormData, BuyerProfile, ValidationError } from '@/types/order';

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
        .ilike('opt_id', normalizedOptId)
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
      return {
        ...data,
        user_type: 'buyer' as const
      };
    } catch (error) {
      console.error('❌ Exception in findBuyerByOptId:', error);
      return null;
    }
  }, []);

  const validateSeller = useCallback(async (sellerId: string): Promise<{ isValid: boolean; name: string }> => {
    try {
      console.log('🔍 Validating seller with ID:', sellerId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .eq('id', sellerId)
        .eq('user_type', 'seller')
        .maybeSingle();

      if (error) {
        console.error('❌ Error validating seller:', error);
        return { isValid: false, name: 'Unknown Seller' };
      }

      if (!data) {
        console.log('⚠️ Seller not found or not a seller:', sellerId);
        return { isValid: false, name: 'Unknown Seller' };
      }

      console.log('✅ Seller validated:', data);
      return { isValid: true, name: data.full_name || 'Unknown Seller' };
    } catch (error) {
      console.error('❌ Exception in validateSeller:', error);
      return { isValid: false, name: 'Unknown Seller' };
    }
  }, []);

  const getSellerName = useCallback(async (sellerId: string): Promise<string> => {
    const validation = await validateSeller(sellerId);
    return validation.name;
  }, [validateSeller]);

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

    // Validate buyer exists
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
      const sellerValidation = await validateSeller(formData.sellerId);
      if (!sellerValidation.isValid) {
        errors.push({ field: 'sellerId', message: 'Выбранный продавец не найден или не является продавцом' });
      }
    }

    // Validate delivery method
    const validDeliveryMethods = ['self_pickup', 'cargo_rf', 'cargo_kz'];
    if (!validDeliveryMethods.includes(formData.deliveryMethod)) {
      errors.push({ field: 'deliveryMethod', message: 'Некорректный способ доставки' });
    }

    console.log('✅ Validation completed:', { errorsCount: errors.length, buyerFound: !!buyer });
    
    return { errors, buyer };
  }, [findBuyerByOptId, validateSeller]);

  return {
    validateForm,
    findBuyerByOptId,
    getSellerName,
    validateSeller
  };
};
