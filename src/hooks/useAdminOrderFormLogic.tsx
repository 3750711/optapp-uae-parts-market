
import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConditionalCarData } from '@/hooks/useConditionalCarData';
import { useDebounceValue } from '@/hooks/useDebounceValue';
import { useAdminOrderFormData } from './admin-order/useAdminOrderFormData';
import { useAdminOrderInitialization } from './admin-order/useAdminOrderInitialization';
import { useAdminOrderSubmission } from './admin-order/useAdminOrderSubmission';
import { CarBrand, CarModel } from './admin-order/types';

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
  
  // Profiles
  buyerProfiles: any[];
  sellerProfiles: any[];
  selectedSeller: any;
  
  // Car data
  brands: CarBrand[];
  brandModels: CarModel[];
  isLoadingCarData: boolean;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: CarBrand[];
  filteredModels: CarModel[];
  handleBrandChange: (brandId: string, brandName: string) => void;
  handleModelChange: (modelId: string, modelName: string) => void;
  
  // Order creation
  isLoading: boolean;
  createdOrder: any;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleOrderUpdate: (order: any) => void;
  resetForm: () => void;
  
  // Navigation and utils
  navigate: ReturnType<typeof useNavigate>;
  parseTitleForBrand: (title: string) => { brand: string; model: string };
  
  // Creation progress
  creationStage: string;
  creationProgress: number;
  
  // Enhanced initialization states
  isInitializing: boolean;
  initializationError: string | null;
  hasAdminAccess: boolean;
  initializationStage: string;
  initializationProgress: number;
  forceComplete: () => void;
}

export const useAdminOrderFormLogic = (): AdminOrderFormLogicReturn => {
  const navigate = useNavigate();

  // Form data management
  const {
    formData,
    images,
    videos,
    setImages,
    setVideos,
    handleInputChange: baseHandleInputChange,
    handleBrandChange: baseHandleBrandChange,
    handleModelChange: baseHandleModelChange,
    handleImageUpload,
    setAllImages,
    resetForm
  } = useAdminOrderFormData();

  // Initialization
  const {
    isInitializing,
    error: initializationError,
    stage: initializationStage,
    progress: initializationProgress,
    buyerProfiles,
    sellerProfiles,
    forceComplete,
    hasAdminAccess
  } = useAdminOrderInitialization();

  // Submission
  const {
    isLoading,
    stage: creationStage,
    progress: creationProgress,
    createdOrder,
    handleSubmit: baseHandleSubmit,
    handleOrderUpdate
  } = useAdminOrderSubmission();

  // Car data
  const {
    brands,
    brandModels,
    isLoading: isLoadingCarData,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    selectBrand
  } = useConditionalCarData();

  // Debounced search terms
  const debouncedBrandSearch = useDebounceValue(brandSearchTerm, 300);
  const debouncedModelSearch = useDebounceValue(modelSearchTerm, 300);

  // Filtered data
  const filteredBrands = useMemo(() => {
    if (!debouncedBrandSearch) return brands;
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(debouncedBrandSearch.toLowerCase())
    );
  }, [brands, debouncedBrandSearch]);

  const filteredModels = useMemo(() => {
    if (!debouncedModelSearch) return brandModels;
    return brandModels.filter(model => 
      model.name.toLowerCase().includes(debouncedModelSearch.toLowerCase())
    );
  }, [brandModels, debouncedModelSearch]);

  // Enhanced brand change handler with model loading
  const handleBrandChange = useCallback((brandId: string, brandName: string) => {
    baseHandleBrandChange(brandId, brandName);
    if (brandId) {
      selectBrand(brandId);
    }
  }, [baseHandleBrandChange, selectBrand]);

  // Enhanced input change handler
  const handleInputChange = useCallback((field: string, value: string) => {
    if (field === 'brandId') {
      const selectedBrand = brands.find(b => b.id === value);
      if (selectedBrand) {
        handleBrandChange(value, selectedBrand.name);
      }
    } else if (field === 'modelId') {
      const selectedModel = brandModels.find(m => m.id === value);
      if (selectedModel) {
        baseHandleModelChange(value, selectedModel.name);
      }
    } else {
      baseHandleInputChange(field, value);
    }
  }, [brands, brandModels, handleBrandChange, baseHandleModelChange, baseHandleInputChange]);

  // Parse title for brand and model (optimized)
  const parseTitleForBrand = useCallback((title: string) => {
    if (!title || brands.length === 0) {
      return { brand: '', model: '' };
    }

    const lowerTitle = title.toLowerCase();
    const sortedBrands = [...brands].sort((a, b) => b.name.length - a.name.length);

    for (const brand of sortedBrands) {
      const brandNameLower = brand.name.toLowerCase();
      if (lowerTitle.includes(brandNameLower)) {
        const relevantModels = brandModels.filter(model => model.brand_id === brand.id);
        const sortedModels = [...relevantModels].sort((a, b) => b.name.length - a.name.length);
        
        for (const model of sortedModels) {
          const modelNameLower = model.name.toLowerCase();
          if (lowerTitle.includes(modelNameLower)) {
            handleBrandChange(brand.id, brand.name);
            baseHandleModelChange(model.id, model.name);
            return { brand: brand.name, model: model.name };
          }
        }
        handleBrandChange(brand.id, brand.name);
        return { brand: brand.name, model: '' };
      }
    }
    return { brand: '', model: '' };
  }, [brands, brandModels, handleBrandChange, baseHandleModelChange]);

  // Enhanced submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await baseHandleSubmit(formData, images, videos);
  }, [baseHandleSubmit, formData, images, videos]);

  // Find selected seller
  const selectedSeller = useMemo(() => {
    return sellerProfiles.find(seller => seller.id === formData.sellerId) || null;
  }, [sellerProfiles, formData.sellerId]);

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
    
    // Profiles
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    
    // Car data
    brands,
    brandModels,
    isLoadingCarData,
    searchBrandTerm: brandSearchTerm,
    setSearchBrandTerm: setBrandSearchTerm,
    searchModelTerm: modelSearchTerm,
    setSearchModelTerm: setModelSearchTerm,
    filteredBrands,
    filteredModels,
    handleBrandChange,
    handleModelChange: baseHandleModelChange,
    
    // Order creation
    isLoading,
    createdOrder,
    handleSubmit,
    handleOrderUpdate,
    resetForm,
    
    // Navigation and utils
    navigate,
    parseTitleForBrand,
    
    // Creation progress
    creationStage,
    creationProgress,
    
    // Enhanced initialization states
    isInitializing,
    initializationError,
    hasAdminAccess,
    initializationStage,
    initializationProgress,
    forceComplete
  };
};
