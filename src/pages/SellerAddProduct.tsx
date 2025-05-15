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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { useProductTitleParser } from "@/utils/productTitleParser";
import AddProductForm, { productSchema, ProductFormValues } from "@/components/product/AddProductForm";

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use our custom hook for car brands and models - we'll still need this for title parsing
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

  // These state variables are kept for compatibility with the form props
  // but they're no longer actively used for filtering
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  
  // Filter brands based on search term - keeping for compatibility
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  // Filter models based on search term - keeping for compatibility
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

  // When brand changes, update models list
  useEffect(() => {
    if (watchBrandId) {
      selectBrand(watchBrandId);
    }
  }, [watchBrandId, selectBrand]);

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

      // Вызов серверных функций для обработки превью и уведомлений
      await handleServerFunctions(product.id);

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
    }
  };

  // Вынесенная логика вызова серверных функций
  const handleServerFunctions = async (productId: string) => {
    try {
      // Генерируем превью для изображений продукта
      console.log("Triggering preview generation for product:", productId);
      
      const { data: previewData, error: previewError } = await supabase.functions.invoke(
        'generate-preview', 
        {
          body: { action: 'process_product', productId }
        }
      );
      
      if (previewError) {
        console.error("Error generating previews:", previewError);
      } else {
        console.log("Preview generation response:", previewData);
      }

      // Получаем полный продукт с изображениями для уведомления в Telegram
      const { data: productDetails } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*),
          product_videos (*)
        `)
        .eq('id', productId)
        .single();

      // Отправляем уведомление в Telegram о новом товаре
      if (productDetails) {
        console.log("Sending Telegram notification for product:", productId);
        
        const { error: notificationError } = await supabase.functions.invoke(
          'send-telegram-notification', 
          {
            body: { product: productDetails }
          }
        );
        
        if (notificationError) {
          console.error("Error sending Telegram notification:", notificationError);
        }
      }
    } catch (error) {
      console.error("Error in server functions:", error);
      // Не выбрасываем ошибку, так как это некритичные операции
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
          
          <Card className="shadow-md rounded-lg overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle className="text-xl">Информация о товаре</CardTitle>
              <CardDescription>
                Заполните все поля для размещения вашего товара на маркетплейсе
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <AddProductForm
                form={form}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                imageUrls={imageUrls}
                videoUrls={videoUrls}
                userId={user?.id}
                brands={brands || []}
                brandModels={brandModels || []}
                isLoadingCarData={isLoadingCarData}
                watchBrandId={watchBrandId}
                searchBrandTerm={searchBrandTerm}
                setSearchBrandTerm={setSearchBrandTerm}
                searchModelTerm={searchModelTerm}
                setSearchModelTerm={setSearchModelTerm}
                filteredBrands={filteredBrands || []}
                filteredModels={filteredModels || []}
                handleRealtimeImageUpload={handleRealtimeImageUpload}
                setVideoUrls={setVideoUrls}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellerAddProduct;
