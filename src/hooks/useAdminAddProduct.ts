import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { productSchema } from "@/components/product/AddProductForm";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import { useAllCarBrands } from "@/hooks/useAllCarBrands";

const adminProductSchema = productSchema.extend({
  sellerId: z.string().min(1, {
    message: "Выберите продавца",
  }),
});

type AdminProductFormValues = z.infer<typeof adminProductSchema>;

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

  const { parseProductTitle } = useProductTitleParser(
    brands,
    allModels,
    findBrandIdByName,
    () => null
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

  const createProduct = async (values: AdminProductFormValues) => {
    if (imageUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
      
      let modelName = null;
      if (values.modelId) {
        const selectedModel = brandModels.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      if (!selectedBrand || !selectedSeller) {
        toast({
          title: "Ошибка",
          description: "Не найдена марка или продавец",
          variant: "destructive",
        });
        return;
      }
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: Number(values.price),
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName,
          description: values.description || null,
          seller_id: values.sellerId,
          seller_name: selectedSeller.full_name,
          status: 'active',
          place_number: Number(values.placeNumber) || 1,
          delivery_price: Number(values.deliveryPrice) || 0,
        })
        .select()
        .single();

      if (productError) throw productError;

      for (const url of imageUrls) {
        await supabase.from('product_images').insert({
          product_id: product.id,
          url: url,
          is_primary: url === primaryImage
        });
      }

      if (primaryImage) {
        const publicId = extractPublicIdFromUrl(primaryImage);
        if (publicId) {
          await supabase.from('products').update({
            cloudinary_public_id: publicId,
            cloudinary_url: primaryImage
          }).eq('id', product.id);
        }
      }

      for (const videoUrl of videoUrls) {
        await supabase.from('product_videos').insert({
          product_id: product.id,
          url: videoUrl
        });
      }

      supabase.functions.invoke('send-telegram-notification', {
        body: { productId: product.id }
      }).catch(console.error);

      toast({
        title: "Товар создан",
        description: `Товар успешно опубликован для продавца ${selectedSeller.full_name}`,
      });

      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать товар. Попробуйте позже.",
        variant: "destructive",
      });
    }
  };
  
  const onSubmit = (values: AdminProductFormValues) => guardedSubmit(() => createProduct(values));

  return {
    form,
    onSubmit,
    isSubmitting,
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
