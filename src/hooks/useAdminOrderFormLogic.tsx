
import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminOrderFormData } from './admin-order/useAdminOrderFormData';
import { useAdminOrderSubmission } from './admin-order/useAdminOrderSubmission';
import { usePreloadedFormData } from '@/hooks/usePreloadedFormData';
import { useOptimizedAdminAccess } from '@/hooks/useOptimizedAdminAccess';
import { BuyerProfile, SellerProfile } from '@/types/order';

export interface AdminOrderFormLogicReturn {
  // Form data
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  
  // Images and videos
  images: string[];
  videos: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setVideos: React.Dispatch<React.SetStateAction<string[]>>;
  handleImageUpload: (urls: string[]) => void;
  setAllImages: (urls: string[]) => void;
  
  // Preloaded data
  buyerProfiles: BuyerProfile[];
  sellerProfiles: SellerProfile[];
  brands: any[];
  models: any[];
  isLoadingBuyers: boolean;
  isLoadingSellers: boolean;
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  isDataReady: boolean;
  selectedSeller: SellerProfile | null;
  
  // Order creation
  isLoading: boolean;
  createdOrder: any;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleOrderUpdate: (order: any) => void;
  resetForm: () => void;
  
  // Navigation and utils
  navigate: ReturnType<typeof useNavigate>;
  
  // Creation progress
  creationStage: string;
  creationProgress: number;
  
  // Admin access
  hasAdminAccess: boolean;
  isCheckingAdmin: boolean;
  
  // Error handling
  error: string | null;
  retryOperation: () => void;
  clearError: () => void;
}

export const useAdminOrderFormLogic = (): AdminOrderFormLogicReturn => {
  const navigate = useNavigate();

  // Admin access check
  const { hasAdminAccess, isCheckingAdmin } = useOptimizedAdminAccess();

  // Form data management
  const {
    formData,
    images,
    videos,
    setImages,
    setVideos,
    handleInputChange: baseHandleInputChange,
    handleImageUpload,
    setAllImages,
    resetForm: baseResetForm
  } = useAdminOrderFormData();

  // Preloaded form data
  const {
    brands,
    buyerProfiles,
    sellerProfiles,
    isLoadingBrands,
    isLoadingBuyers,
    isLoadingSellers,
    isDataReady,
    getModelsByBrand,
    findBrandById,
    findModelById
  } = usePreloadedFormData();

  // Submission
  const {
    isLoading,
    stage: creationStage,
    progress: creationProgress,
    createdOrder,
    error,
    handleSubmit: baseHandleSubmit,
    handleOrderUpdate,
    resetCreatedOrder,
    retryLastOperation,
    clearError
  } = useAdminOrderSubmission();

  // Получаем модели для выбранного бренда
  const models = useMemo(() => {
    return formData.brandId ? getModelsByBrand(formData.brandId) : [];
  }, [formData.brandId, getModelsByBrand]);

  // Мемоизированный обработчик изменения полей
  const handleInputChange = useCallback((field: string, value: string) => {
    if (field === 'brandId') {
      const selectedBrand = findBrandById(value);
      if (selectedBrand) {
        baseHandleInputChange('brandId', value);
        baseHandleInputChange('brand', selectedBrand.name);
        // Сбрасываем модель при смене бренда
        baseHandleInputChange('modelId', '');
        baseHandleInputChange('model', '');
      }
    } else if (field === 'modelId') {
      const selectedModel = findModelById(value);
      if (selectedModel) {
        baseHandleInputChange('modelId', value);
        baseHandleInputChange('model', selectedModel.name);
      }
    } else {
      baseHandleInputChange(field, value);
    }
  }, [baseHandleInputChange, findBrandById, findModelById]);

  // Мемоизированный обработчик отправки
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price || !formData.sellerId || !formData.buyerOptId) {
      throw new Error('Пожалуйста, заполните все обязательные поля');
    }

    await baseHandleSubmit(formData, images, videos);
  }, [baseHandleSubmit, formData, images, videos]);

  // Мемоизированная функция сброса
  const resetForm = useCallback(() => {
    baseResetForm();
    resetCreatedOrder();
    clearError();
  }, [baseResetForm, resetCreatedOrder, clearError]);

  // Мемоизированный выбранный продавец
  const selectedSeller = useMemo(() => {
    if (!formData.sellerId || !sellerProfiles.length) return null;
    return sellerProfiles.find(seller => seller.id === formData.sellerId) || null;
  }, [sellerProfiles, formData.sellerId]);

  // Мемоизированная функция повтора
  const retryOperation = useCallback(() => {
    if (retryLastOperation) {
      retryLastOperation();
    }
  }, [retryLastOperation]);

  return useMemo(() => ({
    // Form data
    formData,
    handleInputChange,
    
    // Images and videos
    images,
    videos,
    setImages,
    setVideos,
    handleImageUpload,
    setAllImages,
    
    // Preloaded data
    buyerProfiles,
    sellerProfiles,
    brands,
    models,
    isLoadingBuyers,
    isLoadingSellers,
    isLoadingBrands,
    isLoadingModels: false, // models загружаются вместе с brands
    isDataReady,
    selectedSeller,
    
    // Order creation
    isLoading,
    createdOrder,
    handleSubmit,
    handleOrderUpdate,
    resetForm,
    
    // Navigation and utils
    navigate,
    
    // Creation progress
    creationStage,
    creationProgress,
    
    // Admin access
    hasAdminAccess,
    isCheckingAdmin,
    
    // Error handling
    error,
    retryOperation,
    clearError
  }), [
    formData, handleInputChange, images, videos, setImages, setVideos,
    handleImageUpload, setAllImages, buyerProfiles, sellerProfiles,
    brands, models, isLoadingBuyers, isLoadingSellers, isLoadingBrands,
    isDataReady, selectedSeller, isLoading, createdOrder, handleSubmit,
    handleOrderUpdate, resetForm, navigate, creationStage, creationProgress,
    hasAdminAccess, isCheckingAdmin, error, retryOperation, clearError
  ]);
};
