import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { adminProductSchema, AdminProductFormValues } from "@/schemas/adminProductSchema";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { useAllCarBrands } from "@/hooks/useAllCarBrands";
import { useAdminProductCreation } from "@/hooks/useAdminProductCreation";

export const useAdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { guardedSubmit, isSubmitting } = useSubmissionGuard();
  const [sellers, setSellers] = useState<{ id: string; full_name: string; opt_id: string }[]>([]);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [primaryImage, setPrimaryImage] = useState<string>("");

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

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

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
      
      if (watchModelId) {
        const modelBelongsToBrand = validateModelBrand(watchModelId, watchBrandId);
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "");
        }
      }
    }
  }, [watchBrandId, selectBrand, form, validateModelBrand, watchModelId]);

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

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  const filteredModels = brandModels.filter(model =>
    model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
  );

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
        navigate(`/product/${product.id}`);
      }
    } catch (error) {
      // Ошибка уже обработана в createProductWithTransaction
      console.error("Product creation failed:", error);
    }
  };
  
  const onSubmit = (values: AdminProductFormValues) => 
    guardedSubmit(() => handleCreateProduct(values));

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
    searchBrandTerm,
    setSearchBrandTerm,
    searchModelTerm,
    setSearchModelTerm,
    filteredBrands,
    filteredModels,
    handleMobileOptimizedImageUpload,
    handleImageDelete,
  };
};
