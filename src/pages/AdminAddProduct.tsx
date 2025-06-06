import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { useSellers } from "@/hooks/useSellers";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import OptimizedAddProductForm, { productSchema, ProductFormValues } from "@/components/product/OptimizedAddProductForm";

// Расширяем схему продукта для включения продавца
const adminProductSchema = productSchema.extend({
  sellerId: z.string().min(1, {
    message: "Выберите продавца",
  }),
});

type AdminProductFormValues = z.infer<typeof adminProductSchema>;

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [primaryImage, setPrimaryImage] = useState<string>("");
  
  // Хуки для данных
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    validateModelBrand 
  } = useCarBrandsAndModels();

  const { sellers, isLoading: isLoadingSellers, error: sellersError, refetch: refetchSellers } = useSellers();

  // Защита от повторных отправок
  const { guardedSubmit, isSubmitting } = useSubmissionGuard({
    timeout: 5000,
    onDuplicateSubmit: () => {
      toast({
        title: "Предупреждение",
        description: "Товар уже создается, подождите...",
        variant: "destructive",
      });
    }
  });

  // Парсер заголовков
  const { parseProductTitle } = useProductTitleParser(
    brands,
    brandModels,
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
      deliveryPrice: "0",
      sellerId: "",
    },
    mode: "onChange",
  });

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // Автоопределение марки и модели из заголовка
  useEffect(() => {
    if (watchTitle && brands.length > 0 && !watchBrandId) {
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
  }, [watchTitle, brands, brandModels, parseProductTitle, form, watchBrandId, toast]);

  // Обновление списка моделей при смене марки
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

  // Валидация модели при изменении списка моделей
  useEffect(() => {
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [brandModels, watchModelId, form]);

  const handleImageUpload = (urls: string[]) => {
    console.log('📷 Новые изображения загружены:', {
      urls,
      existingCount: imageUrls.length,
      timestamp: new Date().toISOString()
    });
    
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    // Установка основного изображения если его нет
    if (!primaryImage && urls.length > 0) {
      console.log('🎯 Установка основного изображения:', urls[0]);
      setPrimaryImage(urls[0]);
    }
  };

  const removeImage = (url: string) => {
    const newImageUrls = imageUrls.filter(item => item !== url);
    setImageUrls(newImageUrls);
    
    // Если удаляется основное изображение, устанавливаем новое
    if (primaryImage === url) {
      if (newImageUrls.length > 0) {
        setPrimaryImage(newImageUrls[0]);
      } else {
        setPrimaryImage("");
      }
    }
  };

  // Создание товара с использованием RPC функций
  const createProduct = async (values: AdminProductFormValues) => {
    console.log('🚀 Создание товара администратором:', values);

    try {
      // Получение данных о марке и модели
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
      
      let modelName = null;
      if (values.modelId) {
        const selectedModel = brandModels.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      if (!selectedBrand) {
        throw new Error("Выбранная марка не найдена");
      }

      if (!selectedSeller) {
        throw new Error("Выбранный продавец не найден");
      }

      console.log('🏭 Создание товара через admin RPC функцию...', {
        title: values.title,
        seller: selectedSeller.full_name,
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
        timestamp: new Date().toISOString()
      });
      
      // Создание товара через admin RPC функцию
      const { data: productId, error: productError } = await supabase.rpc('admin_create_product', {
        p_title: values.title,
        p_price: parseFloat(values.price),
        p_condition: "Новый",
        p_brand: selectedBrand.name,
        p_model: modelName,
        p_description: values.description || null,
        p_seller_id: values.sellerId,
        p_seller_name: selectedSeller.full_name,
        p_status: 'active',
        p_place_number: parseInt(values.placeNumber),
        p_delivery_price: values.deliveryPrice ? parseFloat(values.deliveryPrice) : 0,
      });

      if (productError) {
        console.error("Ошибка создания товара:", productError);
        throw new Error(`Не удалось создать товар: ${productError.message}`);
      }

      if (!productId) {
        throw new Error("Создание товара не вернуло ID");
      }

      console.log('✅ Товар создан с ID:', productId);

      // Добавление изображений
      for (const url of imageUrls) {
        const { error: imageError } = await supabase.rpc('admin_insert_product_image', {
          p_product_id: productId,
          p_url: url,
          p_is_primary: url === primaryImage
        });
          
        if (imageError) {
          console.error('Ошибка добавления изображения:', imageError);
          toast({
            title: "Предупреждение",
            description: `Не удалось добавить изображение: ${imageError.message}`,
            variant: "destructive",
          });
        }
      }

      // Добавление видео
      if (videoUrls.length > 0) {
        for (const videoUrl of videoUrls) {
          const { error: videoError } = await supabase.rpc('admin_insert_product_video', {
            p_product_id: productId,
            p_url: videoUrl
          });
            
          if (videoError) {
            console.error('Ошибка добавления видео:', videoError);
            toast({
              title: "Предупреждение",
              description: `Не удалось добавить видео: ${videoError.message}`,
              variant: "destructive",
            });
          }
        }
      }

      // Отправка уведомления
      try {
        supabase.functions.invoke('send-telegram-notification', {
          body: { productId: productId }
        }).catch(notifyError => {
          console.error("Ошибка отправки уведомления:", notifyError);
        });
      } catch (notifyError) {
        console.warn("Ошибка отправки уведомления:", notifyError);
      }

      toast({
        title: "Товар создан",
        description: `Товар успешно создан для продавца ${selectedSeller.full_name}`,
      });

      navigate(`/product/${productId}`);
    } catch (error) {
      console.error("Ошибка создания товара:", error);
      
      let errorMessage = "Не удалось создать товар. Попробуйте позже.";
      
      if (error instanceof Error) {
        if (error.message.includes('Only admins can use this function')) {
          errorMessage = "У вас нет прав администратора для создания товаров.";
        } else if (error.message.includes('Не удалось создать товар')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (values: AdminProductFormValues) => {
    guardedSubmit(() => createProduct(values));
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <OptimizedAddProductForm
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            brands={brands}
            brandModels={brandModels}
            isLoadingCarData={isLoadingCarData}
            watchBrandId={watchBrandId}
            searchBrandTerm={searchBrandTerm}
            setSearchBrandTerm={setSearchBrandTerm}
            searchModelTerm={searchModelTerm}
            setSearchModelTerm={setSearchModelTerm}
            handleMobileOptimizedImageUpload={handleImageUpload}
            setVideoUrls={setVideoUrls}
            primaryImage={primaryImage}
            setPrimaryImage={setPrimaryImage}
            onImageDelete={removeImage}
            sellers={sellers}
            isLoadingSellers={isLoadingSellers}
            sellersError={sellersError}
            onRefetchSellers={refetchSellers}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddProduct;
