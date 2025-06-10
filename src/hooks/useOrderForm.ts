
import { useState, useCallback } from 'react';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';

export interface OrderFormData {
  title: string;
  price: string;
  description: string;
  brand: string;
  model: string;
  brandId: string;
  modelId: string;
  buyerPhone: string;
  buyerName: string;
  buyerOptId: string;
  delivery_price: string;
  place_number: string;
  [key: string]: string;
}

interface UseOrderFormProps {
  productId?: string | null;
}

export const useOrderForm = ({ productId }: UseOrderFormProps) => {
  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    price: '',
    description: '',
    brand: '',
    model: '',
    brandId: '',
    modelId: '',
    buyerPhone: '',
    buyerName: '',
    buyerOptId: '',
    delivery_price: '',
    place_number: '1'
  });

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 5000,
    onDuplicateSubmit: () => {
      console.log('Duplicate submission prevented');
    }
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setTouchedFields(prev => new Set([...prev, field]));
    setHasUnsavedChanges(true);
  }, []);

  const handleImageUpload = useCallback((urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  }, []);

  const handleImageDelete = useCallback((url: string) => {
    setImages(prev => prev.filter(img => img !== url));
  }, []);

  const handleVideoUpload = useCallback((urls: string[]) => {
    setVideos(prev => [...prev, ...urls]);
  }, []);

  const handleVideoDelete = useCallback((url: string) => {
    setVideos(prev => prev.filter(v => v !== url));
  }, []);

  const isFieldValid = useCallback((field: string) => {
    const value = formData[field];
    if (field === 'title') return value.length >= 3;
    if (field === 'price') return parseFloat(value) > 0;
    if (field === 'buyerOptId') return value.length > 0;
    return true;
  }, [formData]);

  const getFieldError = useCallback((field: string) => {
    if (!touchedFields.has(field)) return null;
    
    const value = formData[field];
    if (field === 'title' && value.length < 3) {
      return 'Название должно содержать минимум 3 символа';
    }
    if (field === 'price' && parseFloat(value) <= 0) {
      return 'Цена должна быть больше 0';
    }
    if (field === 'buyerOptId' && value.length === 0) {
      return 'OPT_ID обязателен';
    }
    return null;
  }, [formData, touchedFields]);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      price: '',
      description: '',
      brand: '',
      model: '',
      brandId: '',
      modelId: '',
      buyerPhone: '',
      buyerName: '',
      buyerOptId: '',
      delivery_price: '',
      place_number: '1'
    });
    setImages([]);
    setVideos([]);
    setTouchedFields(new Set());
    setHasUnsavedChanges(false);
  }, []);

  const markOrderAsCreated = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

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
    handleVideoUpload,
    handleVideoDelete,
    setImages,
    setVideos,
    guardedSubmit,
    resetForm,
    markOrderAsCreated
  };
};
