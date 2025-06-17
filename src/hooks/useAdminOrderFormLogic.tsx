
import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounceValue } from '@/hooks/useDebounceValue';
import { useAdminOrderFormData } from './admin-order/useAdminOrderFormData';
import { useAdminOrderSubmission } from './admin-order/useAdminOrderSubmission';
import { useLazyCarData } from '@/hooks/useLazyCarData';
import { useLazyProfiles } from '@/hooks/useLazyProfiles';
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
  
  // Lazy Profiles
  buyerProfiles: BuyerProfile[];
  sellerProfiles: SellerProfile[];
  isLoadingBuyers: boolean;
  isLoadingSellers: boolean;
  enableBuyersLoading: () => void;
  enableSellersLoading: () => void;
  selectedSeller: SellerProfile | null;
  
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

  // Lazy profiles
  const {
    buyerProfiles,
    sellerProfiles,
    isLoadingBuyers,
    isLoadingSellers,
    enableBuyersLoading,
    enableSellersLoading
  } = useLazyProfiles();

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
    
    // Validate required fields
    if (!formData.title || !formData.price || !formData.sellerId || !formData.buyerOptId) {
      throw new Error('Пожалуйста, заполните все обязательные поля');
    }

    try {
      await baseHandleSubmit(formData, images, videos);
    } catch (error) {
      console.error('Order submission error:', error);
      throw error;
    }
  }, [baseHandleSubmit, formData, images, videos]);

  // Enhanced reset form function
  const resetForm = useCallback(() => {
    baseResetForm();
    resetCreatedOrder();
    clearError();
  }, [baseResetForm, resetCreatedOrder, clearError]);

  // Find selected seller with fallback
  const selectedSeller = useMemo(() => {
    if (!formData.sellerId || !sellerProfiles.length) return null;
    return sellerProfiles.find(seller => seller.id === formData.sellerId) || null;
  }, [sellerProfiles, formData.sellerId]);

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
    
    // Lazy Profiles
    buyerProfiles,
    sellerProfiles,
    isLoadingBuyers,
    isLoadingSellers,
    enableBuyersLoading,
    enableSellersLoading,
    selectedSeller,
    
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
    
    // Admin access
    hasAdminAccess,
    isCheckingAdmin,
    
    // Error handling
    error,
    retryOperation,
    clearError
  };
};
