
import { useState, useCallback } from 'react';
import { OrderFormData } from '@/components/admin/order/types';

export const useAdminOrderFormData = () => {
  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    price: '',
    buyerOptId: '',
    brand: '',
    model: '',
    brandId: '',
    modelId: '',
    sellerId: '',
    deliveryMethod: 'cargo_rf' as const, // Changed from 'self_pickup' to 'cargo_rf'
    place_number: '1',
    text_order: '',
    delivery_price: ''
  });

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleBrandChange = useCallback((brandId: string, brandName: string) => {
    setFormData(prev => ({
      ...prev,
      brandId,
      brand: brandName,
      modelId: '',
      model: ''
    }));
  }, []);

  const handleModelChange = useCallback((modelId: string, modelName: string) => {
    setFormData(prev => ({
      ...prev,
      modelId,
      model: modelName
    }));
  }, []);

  const handleImageUpload = useCallback((urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  }, []);

  const setAllImages = useCallback((urls: string[]) => {
    setImages(urls);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      price: '',
      buyerOptId: '',
      brand: '',
      model: '',
      brandId: '',
      modelId: '',
      sellerId: '',
      deliveryMethod: 'cargo_rf' as const, // Reset to cargo_rf
      place_number: '1',
      text_order: '',
      delivery_price: ''
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
    handleBrandChange,
    handleModelChange,
    handleImageUpload,
    setAllImages,
    resetForm
  };
};
