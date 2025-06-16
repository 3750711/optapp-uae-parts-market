
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { adminProductSchema, AdminProductFormValues } from "@/schemas/adminProductSchema";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { useAdminProductCreation } from "@/hooks/useAdminProductCreation";
import { useOptimizedFormAutosave } from "@/hooks/useOptimizedFormAutosave";
import { useCachedBrands, useCachedModels, useCachedAllModels, useCachedSellers } from "@/hooks/useCachedReferenceData";
import { useDebounceValue } from "@/hooks/useDebounceValue";

export const useOptimizedAdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { guardedSubmit, isSubmitting } = useSubmissionGuard();
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  // Preview dialog state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<AdminProductFormValues | null>(null);

  // Cached data hooks
  const { data: brands = [], isLoading: isLoadingBrands } = useCachedBrands();
  const { data: brandModels = [], isLoading: isLoadingModels } = useCachedModels(selectedBrandId);
  const { data: allModels = [] } = useCachedAllModels();
  const { data: sellers = [], isLoading: isLoadingSellers } = useCachedSellers();

  const { createProductWithTransaction, isCreating } = useAdminProductCreation();

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
      sellerId: "",
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
    return form.getValues();
  }, [form]);

  const { loadSavedData, clearSavedData, draftExists } = useOptimizedFormAutosave({
    key: 'admin_add_product_draft',
    data: getFormDataForAutosave(),
    enabled: !isSubmitting && !isCreating,
    excludeFields: ['imageUrls', 'videoUrls', 'primaryImage']
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

  const { parseProductTitle } = useProductTitleParser(
    brands,
    allModels,
    findBrandIdByName,
    findModelIdByName
  );

  // Load draft on component mount
  useEffect(() => {
    if (!draftLoaded && !isSubmitting && !isCreating && draftExists) {
      setShowDraftAlert(true);
      setDraftLoaded(true);
    }
  }, [draftExists, isSubmitting, isCreating, draftLoaded]);

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
        const modelBelongsToBrand = brandModels.some(model => 
          model.id === watchModelId && model.brand_id === watchBrandId
        );
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "", { shouldValidate: true });
        }
      }
    }
  }, [watchBrandId, selectedBrandId, watchModelId, brandModels, form]);

  const handleLoadDraft = useCallback(() => {
    const savedData = loadSavedData();
    if (savedData && Object.keys(savedData).length > 0) {
      Object.entries(savedData).forEach(([key, value]) => {
        if (value && key in form.getValues()) {
          form.setValue(key as keyof AdminProductFormValues, value as any, { shouldValidate: true });
        }
      });
      
      toast({
        title: "Черновик загружен",
        description: "Форма заполнена данными из сохраненного черновика",
      });
    }
  }, [loadSavedData, form, toast]);

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
      const product = await createProductWithTransaction({
        values,
        imageUrls,
        videoUrls,
        primaryImage,
        sellers,
        brands,
        brandModels
      });

      if (product) {
        clearSavedData();
        navigate(`/product/${product.id}`);
      }
    } catch (error) {
      console.error("Product creation failed:", error);
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
    const selectedModel = brandModels.find(m => m.id === previewData.modelId);
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
    isSubmitting: isSubmitting || isCreating,
    imageUrls,
    videoUrls,
    setVideoUrls,
    primaryImage,
    setPrimaryImage,
    sellers,
    brands,
    brandModels,
    isLoadingCarData: isLoadingBrands || isLoadingModels || isLoadingSellers,
    handleMobileOptimizedImageUpload: handleImageUpload,
    handleImageDelete,
    showDraftAlert,
    setShowDraftAlert,
    draftExists,
    handleLoadDraft,
    clearSavedData,
    // Preview dialog
    isPreviewOpen,
    closePreview: () => {
        setIsPreviewOpen(false);
        setPreviewData(null);
    },
    richPreviewData: getRichPreviewData(),
    handleConfirmPublish,
  };
};
