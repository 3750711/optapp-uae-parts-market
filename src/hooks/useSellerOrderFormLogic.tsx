
import { useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminOrderFormData } from './admin-order/useAdminOrderFormData';
import { useSellerOrderSubmission } from './admin-order/useSellerOrderSubmission';
import { useLazyCarData } from '@/hooks/useLazyCarData';
import { useLazyProfiles } from '@/hooks/useLazyProfiles';
import { useAuth } from '@/contexts/AuthContext';

export interface SellerOrderFormLogicReturn {
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
  
  // Lazy Profiles (only buyers for sellers)
  buyerProfiles: any[];
  isLoadingBuyers: boolean;
  
  // Lazy Car data
  brands: any[];
  models: any[];
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  enableBrandsLoading: () => void;
  selectBrand: (brandId: string) => void;
  findBrandNameById: (brandId: string | null) => string | null;
  findModelNameById: (modelId: string | null) => string | null;
  
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
  
  // Error handling
  error: string | null;
  retryOperation: () => void;
  clearError: () => void;
  
  // Loading states
  isInitializing: boolean;
}

export const useSellerOrderFormLogic = (): SellerOrderFormLogicReturn => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Lazy car data
  const {
    brands,
    models,
    isLoadingBrands,
    isLoadingModels,
    enableBrandsLoading,
    selectBrand,
    findBrandNameById,
    findModelNameById
  } = useLazyCarData();

  // Lazy profiles (only buyers for sellers)
  const {
    buyerProfiles,
    isLoadingBuyers,
    enableBuyersLoading
  } = useLazyProfiles();

  // Submission (seller-specific)
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
  } = useSellerOrderSubmission();

  // Auto-load critical data for sellers (always load buyers and brands)
  useEffect(() => {
    console.log('🚀 Auto-loading data for seller order form...');
    enableBuyersLoading();
    enableBrandsLoading();
  }, [enableBuyersLoading, enableBrandsLoading]);

  // Auto-set current user as seller
  useEffect(() => {
    if (user && user.id && !formData.sellerId) {
      console.log('Setting current user as seller:', user.id);
      baseHandleInputChange('sellerId', user.id);
    }
  }, [user, formData.sellerId, baseHandleInputChange]);

  // Check if still initializing data
  const isInitializing = useMemo(() => {
    // Consider initializing if buyers or brands are still loading
    return isLoadingBuyers || isLoadingBrands;
  }, [isLoadingBuyers, isLoadingBrands]);

  // Enhanced input change handler with car data integration
  const handleInputChange = useCallback((field: string, value: string) => {
    if (field === 'brandId') {
      const selectedBrand = brands.find(b => b.id === value);
      if (selectedBrand) {
        baseHandleInputChange('brandId', value);
        baseHandleInputChange('brand', selectedBrand.name);
        selectBrand(value);
        // Reset model when brand changes
        baseHandleInputChange('modelId', '');
        baseHandleInputChange('model', '');
      }
    } else if (field === 'modelId') {
      const selectedModel = models.find(m => m.id === value);
      if (selectedModel) {
        baseHandleInputChange('modelId', value);
        baseHandleInputChange('model', selectedModel.name);
      }
    } else {
      baseHandleInputChange(field, value);
    }
  }, [brands, models, baseHandleInputChange, selectBrand]);

  // Enhanced submit handler with error handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields for seller
    if (!formData.title || !formData.price || !formData.sellerId || !formData.buyerOptId) {
      throw new Error('Пожалуйста, заполните все обязательные поля');
    }

    try {
      await baseHandleSubmit(formData, images, videos);
    } catch (error) {
      console.error('Seller order submission error:', error);
      throw error;
    }
  }, [baseHandleSubmit, formData, images, videos]);

  // Enhanced reset form function
  const resetForm = useCallback(() => {
    baseResetForm();
    resetCreatedOrder();
    clearError();
  }, [baseResetForm, resetCreatedOrder, clearError]);

  // Retry operation wrapper
  const retryOperation = useCallback(() => {
    if (retryLastOperation) {
      retryLastOperation();
    }
  }, [retryLastOperation]);

  return {
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
    
    // Lazy Profiles (only buyers for sellers)
    buyerProfiles,
    isLoadingBuyers,
    
    // Lazy Car data
    brands,
    models,
    isLoadingBrands,
    isLoadingModels,
    enableBrandsLoading,
    selectBrand,
    findBrandNameById,
    findModelNameById,
    
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
    
    // Error handling
    error,
    retryOperation,
    clearError,
    
    // Loading states
    isInitializing
  };
};
