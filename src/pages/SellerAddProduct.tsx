
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { useProductTitleParser } from "@/utils/productTitleParser";
import AddProductForm, { productSchema, ProductFormValues } from "@/components/product/AddProductForm";
import { Progress } from "@/components/ui/progress";

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [progressStatus, setProgressStatus] = useState({ step: "", progress: 0 });
  
  // Use our custom hook for car brands and models
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData 
  } = useCarBrandsAndModels();

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    brandModels,
    findBrandIdByName,
    findModelIdByName
  );

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  // Filter models based on search term
  const filteredModels = brandModels.filter(model => 
    model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: "",
      brandId: "",
      modelId: "",
      placeNumber: "1",
      description: "",
      deliveryPrice: "0",
    },
    mode: "onChange", // Enable validation on change
  });

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // When title changes, try to detect brand and model
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

  // When brand changes, reset model selection and update models list
  useEffect(() => {
    if (watchBrandId) {
      selectBrand(watchBrandId);
      
      // Only reset model if the brand has changed and we have a selected model
      if (watchModelId) {
        const modelBelongsToBrand = brandModels.some(model => model.id === watchModelId && model.brand_id === watchBrandId);
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "");
        }
      }
    }
  }, [watchBrandId, selectBrand, form, brandModels, watchModelId]);

  // Validate model when brandModels change (to handle async loading)
  useEffect(() => {
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [brandModels, watchModelId, form]);

  const handleRealtimeImageUpload = (urls: string[]) => {
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user || !profile) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы как продавец",
        variant: "destructive",
      });
      return;
    }

    if (imageUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setProgressStatus({ step: "Создание товара", progress: 10 });

    try {
      // Получаем имена бренда и модели для базы данных
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      
      // Модель опциональна, обрабатываем соответственно
      let modelName = null;
      if (values.modelId) {
        const selectedModel = brandModels.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      if (!selectedBrand) {
        toast({
          title: "Ошибка",
          description: "Выбранная марка не найдена",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Устанавливаем имя продавца, убеждаясь, что оно никогда не будет null
      const sellerName = profile.full_name || user.email || "Unknown Seller";

      setProgressStatus({ step: "Сохранение данных товара", progress: 30 });

      // Логируем данные для отладки на мобильных устройствах
      console.log("Preparing to insert product:", {
        title: values.title,
        price: parseFloat(values.price),
        brand: selectedBrand.name,
        model: modelName,
        seller: sellerName,
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
        deliveryPrice: values.deliveryPrice ? parseFloat(values.deliveryPrice) : 0
      });

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: parseFloat(values.price),
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName, // Может быть null
          description: values.description || null,
          seller_id: user.id,
          seller_name: sellerName,
          status: 'pending',
          place_number: parseInt(values.placeNumber),
          delivery_price: values.deliveryPrice ? parseFloat(values.deliveryPrice) : 0,
        })
        .select('id')
        .single();

      if (productError) {
        console.error("Error creating product:", productError);
        throw new Error(`Ошибка создания товара: ${productError.message || 'Неизвестная ошибка'}`);
      }
      
      console.log("Product created successfully:", product.id);
      setProgressStatus({ step: "Сохранение изображений", progress: 60 });

      // Изображения уже загружены, нужно только связать их с продуктом
      const productImages = imageUrls.map((url, index) => ({
        product_id: product.id,
        url: url,
        is_primary: index === 0
      }));
      
      console.log("Associating images with product:", productImages.length);

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(productImages);

      if (imagesError) {
        console.error("Error associating images:", imagesError);
        throw new Error(`Ошибка сохранения изображений: ${imagesError.message || 'Неизвестная ошибка'}`);
      }
      
      console.log("Images associated successfully");
      setProgressStatus({ step: "Сохранение видео", progress: 80 });

      if (videoUrls.length > 0) {
        console.log("Associating videos with product:", videoUrls.length);
        
        const { error: videosError } = await supabase
          .from('product_videos')
          .insert(
            videoUrls.map((url) => ({
              product_id: product.id,
              url
            }))
          );

        if (videosError) {
          console.error("Error associating videos:", videosError);
          throw new Error(`Ошибка сохранения видео: ${videosError.message || 'Неизвестная ошибка'}`);
        }
        
        console.log("Videos associated successfully");
      }
      
      setProgressStatus({ step: "Завершение", progress: 100 });

      toast({
        title: "Товар добавлен",
        description: "Ваш товар успешно размещен на маркетплейсе",
      });

      // Перенаправление на страницу товара вместо dashboard
      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error 
          ? error.message 
          : "Не удалось добавить товар. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setProgressStatus({ step: "", progress: 0 });
    }
  };

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Информация о товаре</CardTitle>
              <CardDescription>
                Заполните все поля для размещения вашего товара на маркетплейсе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddProductForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                imageUrls={imageUrls}
                videoUrls={videoUrls}
                userId={user?.id}
                brands={brands}
                brandModels={brandModels}
                isLoadingCarData={isLoadingCarData}
                watchBrandId={watchBrandId}
                searchBrandTerm={searchBrandTerm}
                setSearchBrandTerm={setSearchBrandTerm}
                searchModelTerm={searchModelTerm}
                setSearchModelTerm={setSearchModelTerm}
                filteredBrands={filteredBrands}
                filteredModels={filteredModels}
                handleRealtimeImageUpload={handleRealtimeImageUpload}
                setVideoUrls={setVideoUrls}
              />
            </CardContent>
            
            {isSubmitting && (
              <div className="px-6 pb-4">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm font-medium">{progressStatus.step || "Публикация товара..."}</span>
                  <span className="text-sm">{progressStatus.progress}%</span>
                </div>
                <Progress value={progressStatus.progress} className="h-2" />
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellerAddProduct;
