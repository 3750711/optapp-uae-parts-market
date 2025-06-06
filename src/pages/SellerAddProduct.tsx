import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { useFormAutosave } from "@/hooks/useFormAutosave";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import OptimizedAddProductForm, { productSchema, ProductFormValues } from "@/components/product/OptimizedAddProductForm";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge, Sparkles } from "lucide-react";

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
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  
  // Use our custom hook for car brands and models
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData 
  } = useCarBrandsAndModels();

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
    mode: "onChange",
  });

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    brandModels,
    findBrandIdByName,
    findModelIdByName
  );

  // Автосохранение формы
  const formData = form.watch();
  const { loadSavedData, clearSavedData } = useFormAutosave({
    key: 'seller_add_product',
    data: formData,
    enabled: !isSubmitting
  });

  // Breadcrumbs навигация
  const breadcrumbItems = useMemo(() => [
    { label: "Профиль продавца", href: "/seller/profile" },
    { label: "Добавить товар" }
  ], []);

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // Загрузка сохраненного черновика при инициализации
  useEffect(() => {
    const savedData = loadSavedData();
    if (savedData && Object.keys(savedData).length > 0) {
      // Проверяем, что форма пуста перед загрузкой черновика
      const currentFormIsEmpty = !formData.title && !formData.price && !formData.brandId;
      
      if (currentFormIsEmpty) {
        Object.entries(savedData).forEach(([key, value]) => {
          if (value && key in formData) {
            form.setValue(key as keyof ProductFormValues, value as any);
          }
        });
        
        setShowDraftSaved(true);
        setTimeout(() => setShowDraftSaved(false), 5000);
      }
    }
  }, [loadSavedData, form]);

  // Мемоизированная функция для обработки изменений названия
  const handleTitleChange = useCallback((title: string) => {
    if (title && brands.length > 0 && !watchBrandId) {
      const { brandId, modelId } = parseProductTitle(title);
      
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
  }, [brands, brandModels, parseProductTitle, form, watchBrandId, toast]);

  // Объединенный и оптимизированный useEffect для обработки изменений
  useEffect(() => {
    // Обработка изменений названия с debounce
    if (watchTitle) {
      const timeoutId = setTimeout(() => {
        handleTitleChange(watchTitle);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [watchTitle, handleTitleChange]);

  // Отдельный useEffect для обработки изменений бренда и модели
  useEffect(() => {
    if (watchBrandId) {
      selectBrand(watchBrandId);
      
      // Reset model if it doesn't belong to the selected brand
      if (watchModelId) {
        const modelBelongsToBrand = brandModels.some(model => 
          model.id === watchModelId && model.brand_id === watchBrandId
        );
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "");
        }
      }
    }

    // Validate model when brandModels change
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [watchBrandId, watchModelId, selectBrand, form, brandModels]);

  const handleMobileOptimizedImageUpload = useCallback((urls: string[]) => {
    setImageUrls(urls);
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    } else if (primaryImage && !urls.includes(primaryImage)) {
      if (urls.length > 0) {
        setPrimaryImage(urls[0]);
      } else {
        setPrimaryImage("");
      }
    }
  }, [primaryImage]);

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

      const sellerName = profile.full_name || user.email || "Unknown Seller";

      setProgressStatus({ step: "Сохранение данных товара", progress: 30 });

      // Create product first
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: parseFloat(values.price),
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName,
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
        throw new Error(`Ошибка создания товара: ${productError.message || 'Неизвестная ошибка'}`);
      }
      
      setProgressStatus({ step: "Сохранение изображений и Cloudinary обработка", progress: 60 });

      // Save product images with primary image detection
      const productImages = imageUrls.map((url) => ({
        product_id: product.id,
        url: url,
        is_primary: url === primaryImage
      }));

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(productImages);

      if (imagesError) {
        throw new Error(`Ошибка сохранения изображений: ${imagesError.message || 'Неизвестная ошибка'}`);
      }

      // If we have a primary image, trigger Cloudinary upload
      if (primaryImage) {
        setProgressStatus({ step: "Загрузка основного изображения в Cloudinary", progress: 75 });
        
        try {
          console.log('🚀 Starting Cloudinary upload for primary image:', primaryImage);
          
          const { uploadToCloudinary } = await import("@/utils/cloudinaryUpload");
          const cloudinaryResult = await uploadToCloudinary(
            primaryImage,
            product.id,
            `product_${product.id}_primary`
          );

          if (cloudinaryResult.success && cloudinaryResult.cloudinaryUrl) {
            console.log('✅ Cloudinary upload successful, updating product...');
            
            // Update product with Cloudinary data
            const { error: updateError } = await supabase
              .from('products')
              .update({
                cloudinary_public_id: cloudinaryResult.publicId,
                cloudinary_url: cloudinaryResult.cloudinaryUrl,
                preview_image_url: cloudinaryResult.cloudinaryUrl
              })
              .eq('id', product.id);

            if (updateError) {
              console.error('❌ Failed to update product with Cloudinary data:', updateError);
            } else {
              console.log('✅ Product updated with Cloudinary data');
              toast({
                title: "Cloudinary интеграция",
                description: "Изображение успешно обработано через Cloudinary",
              });
            }
          } else {
            console.warn('⚠️ Cloudinary upload failed:', cloudinaryResult.error);
          }
        } catch (cloudinaryError) {
          console.error('💥 Cloudinary upload error:', cloudinaryError);
          // Continue with normal flow if Cloudinary fails
        }
      }
      
      setProgressStatus({ step: "Сохранение видео", progress: 85 });

      if (videoUrls.length > 0) {
        const { error: videosError } = await supabase
          .from('product_videos')
          .insert(
            videoUrls.map((url) => ({
              product_id: product.id,
              url
            }))
          );

        if (videosError) {
          throw new Error(`Ошибка сохранения видео: ${videosError.message || 'Неизвестная ошибка'}`);
        }
      }
      
      const { data: currentProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();

      if (currentProduct && currentProduct.status === 'active') {
        setProgressStatus({ step: "Отправка уведомления в Telegram", progress: 90 });
        try {
          supabase.functions.invoke('send-telegram-notification', {
            body: { productId: product.id }
          }).catch(notificationError => {
            console.error("Error sending notification:", notificationError);
          });
        } catch (notificationError) {
          console.error("Exception while sending notification:", notificationError);
        }
      }
      
      setProgressStatus({ step: "Завершение", progress: 100 });

      // Очищаем автосохраненный черновик после успешной публикации
      clearSavedData();

      toast({
        title: "Товар добавлен",
        description: "Ваш товар успешно размещен на маркетплейсе",
      });

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

  // Cleanup function for memory management
  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  return (
    <ErrorBoundary>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                      <Home className="h-4 w-4 mr-1" />
                      Главная
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/seller/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                      Профиль продавца
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage className="text-foreground">
                  Добавить товар
                </BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="text-3xl font-bold mb-6">Добавить товар</h1>
            
            {showDraftSaved && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Загружен сохраненный черновик. Вы можете продолжить заполнение формы.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Информация о товаре
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Cloudinary интеграция
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Заполните все поля для размещения вашего товара на маркетплейсе.
                  Изображения автоматически обрабатываются через Cloudinary для оптимальной производительности.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizedAddProductForm
                  form={form}
                  onSubmit={onSubmit}
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
                  handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
                  setVideoUrls={setVideoUrls}
                  primaryImage={primaryImage}
                  setPrimaryImage={setPrimaryImage}
                  progressStatus={progressStatus}
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
    </ErrorBoundary>
  );
};

export default SellerAddProduct;
