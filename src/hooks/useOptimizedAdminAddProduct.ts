
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { createProductTitleParser } from "@/utils/productTitleParser";
import { adminProductSchema, AdminProductFormValues } from "@/schemas/adminProductSchema";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { useAdminProductCreation } from "@/hooks/useAdminProductCreation";
import { useTrustedSellerProductCreation } from "@/hooks/useTrustedSellerProductCreation";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useOptimizedFormAutosave } from "@/hooks/useOptimizedFormAutosave";
import { useCachedBrands, useCachedModels, useCachedAllModels, useCachedSellers } from "@/hooks/useCachedReferenceData";
import { useDebounceValue } from "@/hooks/useDebounce";

interface UseOptimizedAdminAddProductOptions {
  mode?: 'admin' | 'trusted_seller';
  sellerId?: string;
}

export const useOptimizedAdminAddProduct = (options: UseOptimizedAdminAddProductOptions = {}) => {
  const { mode = 'admin', sellerId } = options;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { guardedSubmit, isSubmitting } = useSubmissionGuard();
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Preview dialog state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<AdminProductFormValues | null>(null);

  // Cached data hooks - продавцы только для админов
  const { data: brands = [], isLoading: isLoadingBrands } = useCachedBrands();
  const { data: brandModels = [], isLoading: isLoadingModels } = useCachedModels(selectedBrandId);
  const { data: allModels = [] } = useCachedAllModels();
  
  // Для доверенных продавцов не загружаем список продавцов
  const { data: sellersData = [], isLoading: isLoadingSellers } = mode === 'admin' 
    ? useCachedSellers() 
    : { data: [], isLoading: false };
  
  // Получаем данные текущего пользователя для trusted_seller режима
  const { data: currentUserProfile } = useCurrentUserProfile();
  
  // Для trusted_seller создаем массив с реальными данными пользователя
  const sellers = mode === 'trusted_seller' && sellerId && currentUserProfile
    ? [{ 
        id: currentUserProfile.id, 
        full_name: currentUserProfile.full_name || 'Пользователь', 
        opt_id: currentUserProfile.opt_id || '' 
      }] 
    : sellersData;

  // Use different hooks based on mode
  const adminHook = useAdminProductCreation();
  const trustedSellerHook = useTrustedSellerProductCreation();
  
  const isCreating = mode === 'trusted_seller' ? trustedSellerHook.isCreating : adminHook.isCreating;
  const progressSteps = mode === 'trusted_seller' ? [] : adminHook.steps;
  const totalProgress = mode === 'trusted_seller' ? 0 : adminHook.totalProgress;
  const resetMonitoring = mode === 'trusted_seller' ? () => {} : adminHook.resetMonitoring;

  const form = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: {
      title: "",
      price: "",
      brandId: "",
      modelId: "",
      placeNumber: "1",
      description: "",
      deliveryPrice: "",
      sellerId: mode === 'trusted_seller' ? sellerId || "" : "",
    },
    mode: "onChange",
  });

  const watchTitle = form.watch("title");
  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  
  // Debounce title for auto-parsing
  const debouncedTitle = useDebounceValue(watchTitle, 1000);

  // Enhanced autosave
  const getFormDataForAutosave = useCallback(() => {
    return { ...form.getValues(), imageUrls, videoUrls, primaryImage };
  }, [form, imageUrls, videoUrls, primaryImage]);

  const { loadSavedData, clearSavedData, saveNow } = useOptimizedFormAutosave({
    key: mode === 'admin' ? 'admin_add_product' : 'trusted_seller_add_product',
    data: getFormDataForAutosave(),
    delay: 1000,
    enabled: !isSubmitting && !isCreating && !isPublishing && !isPublished,
    excludeFields: []
  });

  // Title parser
  const findBrandIdByName = useCallback((name: string) => {
    return brands.find(brand => 
      brand.name.toLowerCase().includes(name.toLowerCase())
    )?.id;
  }, [brands]);

  const findModelIdByName = useCallback((name: string, brandId?: string) => {
    return allModels.find(model => 
      model.name.toLowerCase().includes(name.toLowerCase()) &&
      (!brandId || model.brand_id === brandId)
    )?.id;
  }, [allModels]);

  // Create parser function with current brands and models data
  const parseProductTitle = useMemo(() => {
    if (brands.length > 0 && allModels.length > 0) {
      return createProductTitleParser(brands, allModels);
    }
    return () => ({ brandId: null, modelId: null });
  }, [brands, allModels]);

  // Silent restore on mount: restore fields in order and media
  useEffect(() => {
    const saved = loadSavedData();
    if (saved && typeof saved === 'object') {
      const { brandId, modelId, imageUrls: savedImages, videoUrls: savedVideos, primaryImage: savedPrimary, ...rest } = saved as any;

      // Apply basic fields first
      Object.entries(rest).forEach(([key, value]) => {
        if (key in form.getValues()) {
          form.setValue(key as keyof AdminProductFormValues, value as any, { shouldValidate: false });
        }
      });

      // Then brand and model (validate model by allModels)
      if (brandId) {
        form.setValue('brandId', brandId as string, { shouldValidate: true });
        setSelectedBrandId(brandId as string);
        if (modelId) {
          const valid = allModels.some(m => m.id === modelId && m.brand_id === brandId);
          form.setValue('modelId', valid ? (modelId as string) : '', { shouldValidate: true });
        }
      }

      // Media
      if (Array.isArray(savedImages)) setImageUrls(savedImages);
      if (Array.isArray(savedVideos)) setVideoUrls(savedVideos);
      if (typeof savedPrimary === 'string') setPrimaryImage(savedPrimary);
    }
  }, [loadSavedData, allModels, form]);

  // Auto-parse title with debounce
  useEffect(() => {
    if (debouncedTitle && brands.length > 0 && allModels.length > 0 && !watchBrandId) {
      const { brandId, modelId } = parseProductTitle(debouncedTitle);
      
      if (brandId) {
        form.setValue("brandId", brandId, { shouldValidate: true });
        setSelectedBrandId(brandId);
        
        if (modelId) {
          // Wait for brand models to load before setting model
          setTimeout(() => {
            form.setValue("modelId", modelId, { shouldValidate: true });
          }, 100);
        }

        toast({
          title: "Авто обнаружено",
          description: "Марка и модель автомобиля определены из названия",
        });
      }
    }
  }, [debouncedTitle, brands, allModels, parseProductTitle, form, watchBrandId, toast]);

  // Handle brand changes
  useEffect(() => {
    if (watchBrandId && watchBrandId !== selectedBrandId) {
      setSelectedBrandId(watchBrandId);
      
      // Reset model when brand changes
      if (watchModelId) {
        const modelBelongsToBrand = allModels.some(model => 
          model.id === watchModelId && model.brand_id === watchBrandId
        );
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "", { shouldValidate: true });
        }
      }
    }
  }, [watchBrandId, selectedBrandId, watchModelId, brandModels, form]);

  // Reset all form and state data
  const resetFormAndState = useCallback(() => {
    // Clear saved data first
    clearSavedData();
    
    // Reset form
    form.reset();
    
    // Reset all state
    setImageUrls([]);
    setVideoUrls([]);
    setPrimaryImage("");
    setSelectedBrandId("");
    setIsPreviewOpen(false);
    setPreviewData(null);
    
    // Mark as published to prevent further autosaving
    setIsPublished(true);
    
    toast({
      title: "Данные очищены",
      description: "Форма готова для создания нового товара",
    });
  }, [clearSavedData, form, toast]);

  // Persist on mobile lifecycle and sync on return (bfcache)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && !isPublishing && !isPublished) {
        saveNow(getFormDataForAutosave());
      }
    };
    const handlePageHide = () => {
      if (!isPublishing && !isPublished) {
        saveNow(getFormDataForAutosave());
      }
    };
    const handlePageShow = () => {
      if (!isPublished) {
        const currentBrand = form.getValues('brandId');
        const currentModel = form.getValues('modelId');
        if (currentBrand) setSelectedBrandId(currentBrand);
        if (currentModel) {
          form.setValue('modelId', currentModel, { shouldValidate: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [saveNow, getFormDataForAutosave, form, isPublishing, isPublished]);

  const handleImageUpload = useCallback((urls: string[]) => {
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  }, [primaryImage]);

  const handleImageDelete = useCallback((urlToDelete: string) => {
    const newImageUrls = imageUrls.filter(url => url !== urlToDelete);
    setImageUrls(newImageUrls);
    if (primaryImage === urlToDelete) {
      setPrimaryImage(newImageUrls.length > 0 ? newImageUrls[0] : "");
    }
  }, [imageUrls, primaryImage]);

  const handleCreateProduct = async (values: AdminProductFormValues) => {
    try {
      // Set publishing flag to disable autosave
      setIsPublishing(true);
      
      if (mode === 'trusted_seller') {
        // Use trusted seller creation logic
        const result = await trustedSellerHook.createTrustedSellerProduct({
          values,
          imageUrls,
          videoUrls,
          primaryImage,
          brands,
          brandModels
        });
        
        if (result) {
          // Reset all form and state data
          resetFormAndState();
          
          // Navigate после успешного создания
          navigate(`/seller/product/${result.productId}?from=add`);
          
          toast({
            title: "Товар успешно создан",
            description: "Перенаправление на страницу товара...",
          });
        }
      } else {
        // Use admin creation logic
        const product = await adminHook.createProductWithTransaction({
          values,
          imageUrls,
          videoUrls,
          primaryImage,
          sellers,
          brands,
          brandModels
        });

        if (product) {
          // Reset all form and state data
          resetFormAndState();
          
          // Navigate после успешного создания
          navigate(`/product/${product.id}`);
          
          toast({
            title: "Товар успешно создан",
            description: "Перенаправление на страницу товара...",
          });
        }
      }
    } catch (error) {
      // Re-enable autosave on error
      setIsPublishing(false);
      console.error("Product creation failed:", error);
      
      toast({
        title: "Ошибка создания товара",
        description: "Попробуйте еще раз. Данные формы сохранены.",
        variant: "destructive",
      });
    }
  };
  
  const handleConfirmPublish = () => {
    if (previewData) {
      guardedSubmit(() => handleCreateProduct(previewData));
    }
  };
  
  const onSubmit = (values: AdminProductFormValues) => {
    setPreviewData(values);
    setIsPreviewOpen(true);
  };
  
  const getRichPreviewData = () => {
    if (!previewData) return null;

    const selectedBrand = brands.find(b => b.id === previewData.brandId);
    const selectedModel = brandModels.find(m => m.id === previewData.modelId) || allModels.find(m => m.id === previewData.modelId);
    const selectedSeller = sellers.find(s => s.id === previewData.sellerId);

    return {
        title: previewData.title,
        price: previewData.price,
        description: previewData.description,
        brandName: selectedBrand?.name,
        modelName: selectedModel?.name,
        sellerName: selectedSeller?.full_name,
        imageUrls,
        videoUrls,
        placeNumber: previewData.placeNumber,
        deliveryPrice: previewData.deliveryPrice,
        primaryImage,
    };
  };

  return {
    form,
    onSubmit,
    isSubmitting: isSubmitting || isCreating || isPublishing,
    imageUrls,
    videoUrls,
    setVideoUrls,
    primaryImage,
    setPrimaryImage,
    sellers,
    brands,
    brandModels,
    isLoadingCarData: isLoadingBrands || isLoadingModels,
    handleMobileOptimizedImageUpload: handleImageUpload,
    handleImageDelete,
    // Preview dialog
    isPreviewOpen,
    closePreview: () => {
        setIsPreviewOpen(false);
        setPreviewData(null);
    },
    richPreviewData: getRichPreviewData(),
    handleConfirmPublish,
    // State management
    isPublished,
    resetFormAndState,
    progressSteps,
    totalProgress,
  };
};
