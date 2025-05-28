
import { useState, useEffect } from 'react';
import { Database } from '@/integrations/supabase/types';
import { useFormAutosave } from '@/hooks/useFormAutosave';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { useRealTimeValidation } from '@/hooks/useRealTimeValidation';
import { toast } from '@/hooks/use-toast';

type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

export interface OrderFormData {
  title: string;
  price: string;
  buyerOptId: string;
  brand: string;
  model: string;
  optid_created: string;
  seller_opt_id: string;
  deliveryMethod: DeliveryMethod;
  place_number: string;
  text_order: string;
  delivery_price: string;
}

interface UseOrderFormProps {
  productId?: string | null;
  initialData?: Partial<OrderFormData>;
}

export const useOrderForm = ({ productId, initialData }: UseOrderFormProps = {}) => {
  const [formData, setFormData] = useState<OrderFormData>({
    title: "",
    price: "",
    buyerOptId: "",
    brand: "",
    model: "",
    optid_created: "",
    seller_opt_id: "",
    deliveryMethod: 'self_pickup' as DeliveryMethod,
    place_number: "1",
    text_order: "",
    delivery_price: "",
    ...initialData,
  });

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validation rules
  const validationRules = [
    {
      field: 'title' as const,
      validator: (value: string) => {
        if (!value?.trim()) return 'Наименование обязательно';
        if (value.length < 3) return 'Минимум 3 символа';
        return null;
      }
    },
    {
      field: 'price' as const,
      validator: (value: string) => {
        if (!value) return 'Укажите цену';
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) return 'Цена должна быть положительным числом';
        return null;
      }
    },
    {
      field: 'buyerOptId' as const,
      validator: (value: string) => {
        if (!value) return 'Выберите покупателя';
        return null;
      }
    }
  ];

  const { validationState, isFieldValid, getFieldError } = useRealTimeValidation(
    { getValues: () => formData, setError: () => {}, clearErrors: () => {}, watch: () => {} } as any,
    validationRules
  );

  // Auto-save functionality
  const { loadSavedData, clearSavedData, hasUnsavedChanges } = useFormAutosave({
    key: `seller_order_${productId || 'new'}`,
    data: { formData, images, videos },
    delay: 30000,
    enabled: true
  });

  // Submission guard
  const { isSubmitting, guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 5000,
    onDuplicateSubmit: () => {
      toast({
        title: "Подождите",
        description: "Заказ уже создается, подождите завершения",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setTouchedFields(prev => new Set(prev).add(field));
  };

  const handleImageUpload = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const handleImageDelete = (urlToDelete: string) => {
    setImages(prev => prev.filter(url => url !== urlToDelete));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      price: "",
      buyerOptId: "",
      brand: "",
      model: "",
      optid_created: "",
      seller_opt_id: "",
      deliveryMethod: 'self_pickup' as DeliveryMethod,
      place_number: "1",
      text_order: "",
      delivery_price: "",
    });
    setImages([]);
    setVideos([]);
    setTouchedFields(new Set());
    clearSavedData();
  };

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadSavedData();
    if (savedData && savedData.formData) {
      setFormData(savedData.formData);
      if (savedData.images) setImages(savedData.images);
      if (savedData.videos) setVideos(savedData.videos);
      toast({
        title: "Восстановлены данные",
        description: "Форма восстановлена из автосохранения",
      });
    }
  }, [loadSavedData]);

  return {
    formData,
    images,
    videos,
    touchedFields,
    isSubmitting,
    canSubmit,
    hasUnsavedChanges,
    isFieldValid,
    getFieldError,
    handleInputChange,
    handleImageUpload,
    handleImageDelete,
    setImages,
    setVideos,
    guardedSubmit,
    resetForm,
  };
};
