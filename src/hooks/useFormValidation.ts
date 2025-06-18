
import { useState, useCallback, useMemo } from 'react';
import { OrderFormData, FormValidationState } from '@/components/admin/order/types';

export const useFormValidation = (formData: OrderFormData) => {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const errors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (touchedFields.has('title') && !formData.title.trim()) {
      errors.title = 'Название обязательно';
    }

    if (touchedFields.has('price') && (!formData.price || parseFloat(formData.price) <= 0)) {
      errors.price = 'Цена должна быть больше 0';
    }

    if (touchedFields.has('sellerId') && !formData.sellerId) {
      errors.sellerId = 'Выберите продавца';
    }

    if (touchedFields.has('buyerOptId') && !formData.buyerOptId.trim()) {
      errors.buyerOptId = 'OPT ID покупателя обязателен';
    }

    return errors;
  }, [formData, touchedFields]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           formData.title.trim() !== '' &&
           formData.price !== '' &&
           parseFloat(formData.price) > 0 &&
           formData.sellerId !== '' &&
           formData.buyerOptId.trim() !== '';
  }, [errors, formData]);

  const touchField = useCallback((field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
  }, []);

  const validation: FormValidationState = {
    isValid,
    errors,
    touchedFields
  };

  return {
    validation,
    touchField
  };
};
