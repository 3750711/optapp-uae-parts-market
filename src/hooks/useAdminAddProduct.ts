import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProductTitleParser } from "@/hooks/useProductTitleParser";
import { adminProductSchema, AdminProductFormValues } from "@/schemas/adminProductSchema";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { useAllCarBrands } from "@/hooks/useAllCarBrands";
import { useAdminProductCreation } from "@/hooks/useAdminProductCreation";
import { useFormAutosave } from "@/hooks/useFormAutosave";

export const useAdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { guardedSubmit, isSubmitting } = useSubmissionGuard();
  const [sellers, setSellers] = useState<{ id: string; full_name: string; opt_id: string }[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // New state for preview dialog
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<AdminProductFormValues | null>(null);

  const { 
    brands, 
    brandModels, 
    allModels,
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    validateModelBrand
  } = useAllCarBrands();

  const { createProductWithTransaction, isCreating } = useAdminProductCreation();

  // Исправляем передачу функций в parseProductTitle - передаем только необходимые функции
  const { parseProductTitle } = useProductTitleParser(
    brands,
    allModels,
    findBrandIdByName,
    findModelIdByName
  );

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

  const getFormDataForAutosave = useCallback(() => {
    return {
      ...form.getValues(),
      imageUrls,
      videoUrls,
      primaryImage,
    };
  }, [form, imageUrls, videoUrls, primaryImage]);

  const { loadSavedData, clearSavedData } = useFormAutosave({
    key: 'admin_add_product_draft',
    data: getFormDataForAutosave(),
    enabled: !isSubmitting && !isCreating,
  });

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  useEffect(() => {
    if (!draftLoaded && !isSubmitting && !isCreating) {
      const savedData = loadSavedData();
      if (savedData && Object.keys(savedData).length > 0) {
        Object.entries(savedData).forEach(([key, value]) => {
          if (value && key in form.getValues()) {
            form.setValue(key as keyof AdminProductFormValues, value as any, { shouldValidate: true });
          }
        });
        if (savedData.imageUrls) setImageUrls(savedData.imageUrls);
        if (savedData.videoUrls) setVideoUrls(savedData.videoUrls);
        if (savedData.primaryImage) setPrimaryImage(savedData.primaryImage);
        
        setShowDraftSaved(true);
        setTimeout(() => setShowDraftSaved(false), 5000);
      }
      setDraftLoaded(true);
    }
  }, [loadSavedData, form, isSubmitting, isCreating, draftLoaded]);

  useEffect(() => {
    if (watchTitle && brands.length > 0 && allModels.length > 0 && !watchBrandId) {
      const { brandId, modelId } = parseProductTitle(watchTitle);
      
      if (brandId) {
        form.setValue("brandId", brandId);
        
        if (modelId) {
          form.setValue("modelId", modelId);
        }

        toast({
          title: "Авто обнаружено",
          description: "Марка и модель автомобиля определены из названия",
        });
      }
    }
  }, [watchTitle, brands, allModels, parseProductTitle, form, watchBrandId, toast]);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, opt_id')
          .eq('user_type', 'seller')
          .not('opt_id', 'is', null)
          .neq('opt_id', '')
          .order('full_name');

        if (error) {
          console.error("Error fetching sellers:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить список продавцов",
            variant: "destructive",
          });
          return;
        }

        setSellers(data || []);
      } catch (error) {
        console.error("Critical error fetching sellers:", error);
        toast({
          title: "Критическая ошибка",
          description: "Не удалось подключиться к базе данных",
          variant: "destructive",
        });
      }
    };

    fetchSellers();
  }, [toast]);

  useEffect(() => {
    if (watchBrandId) {
      selectBrand(watchBrandId);
      form.setValue("modelId", ""); // Reset model when brand changes
    }
  }, [watchBrandId, selectBrand, form]);

  useEffect(() => {
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [brandModels, watchModelId, form]);

  const handleMobileOptimizedImageUpload = (urls: string[]) => {
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  };

  const handleImageDelete = (urlToDelete: string) => {
    const newImageUrls = imageUrls.filter(url => url !== urlToDelete);
    setImageUrls(newImageUrls);
    if (primaryImage === urlToDelete) {
      setPrimaryImage(newImageUrls.length > 0 ? newImageUrls[0] : "");
    }
  };

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
      // Ошибка уже обработана в createProductWithTransaction
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
    isLoadingCarData,
    handleMobileOptimizedImageUpload,
    handleImageDelete,
    showDraftSaved,
    // --- New props for preview dialog ---
    isPreviewOpen,
    closePreview: () => {
        setIsPreviewOpen(false);
        setPreviewData(null);
    },
    richPreviewData: getRichPreviewData(),
    handleConfirmPublish,
  };
};
