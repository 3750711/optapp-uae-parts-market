
import { useState, useCallback } from 'react';
import { OrderFormData } from '@/types/order';
import { normalizeDecimal } from '@/utils/number';

const initialFormData: OrderFormData = {
  title: '',
  price: '',
  buyerOptId: '',
  brand: '',
  model: '',
  brandId: '',
  modelId: '',
  sellerId: '',
  deliveryMethod: 'cargo_rf',
  place_number: '',
  text_order: '',
  delivery_price: '',
  description: '' // Добавляем отсутствующее поле
};

export const useAdminOrderFormData = () => {
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const handleInputChange = useCallback((field: string, value: string) => {
    console.log(`🔄 Form field changed: ${field} = ${value}`);
    let processedValue = value;
    
    // Special handling for numeric fields
    if (['price', 'delivery_price', 'place_number'].includes(field)) {
      if (field === 'place_number') {
        processedValue = Math.max(1, Math.round(normalizeDecimal(value))).toString();
      } else {
        processedValue = normalizeDecimal(value).toString();
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  }, []);

  const handleImageUpload = useCallback((urls: string[]) => {
    console.log('📸 Images uploaded:', urls);
    setImages(prev => [...prev, ...urls]);
  }, []);

  const setAllImages = useCallback((urls: string[]) => {
    console.log('📸 All images set:', urls);
    setImages(urls);
  }, []);

  const resetForm = useCallback(() => {
    console.log('🔄 Resetting form data');
    setFormData({
      title: '',
      price: '',
      buyerOptId: '',
      brand: '',
      model: '',
      brandId: '',
      modelId: '',
      sellerId: '',
      deliveryMethod: 'cargo_rf',
      place_number: '',
      text_order: '',
      delivery_price: '',
      description: '' // Добавляем отсутствующее поле
    });
    setImages([]);
    setVideos([]);
  }, []);

  return {
    formData,
    images,
    videos,
    setImages,
    setVideos,
    handleInputChange,
    handleImageUpload,
    setAllImages,
    resetForm
  };
};
