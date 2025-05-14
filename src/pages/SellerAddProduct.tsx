import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VideoUpload from "@/components/ui/video-upload";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { RealtimeImageUpload } from "@/components/ui/real-time-image-upload";

const productSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  price: z.string().min(1, {
    message: "Укажите цену товара",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Цена должна быть положительным числом",
  }),
  brandId: z.string().min(1, {
    message: "Выберите марку автомобиля",
  }),
  modelId: z.string().optional(), // Model is optional
  placeNumber: z.string().min(1, {
    message: "Укажите количество мест",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number.isInteger(Number(val)), {
    message: "Количество мест должно быть целым положительным числом",
  }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "Стоимость доставки должна быть числом",
  }),
});

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  
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

  const form = useForm<z.infer<typeof productSchema>>({
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

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
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
        videoCount: videoUrls.length
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
      // Используем исправленные URL, которые должны работать с bucket "Product Images"
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

      // Генерируем превью для изображений продукта
      try {
        console.log("Triggering preview generation for product:", product.id);
        
        const { data: previewData, error: previewError } = await supabase.functions.invoke(
          'generate-preview', 
          {
            body: { action: 'process_product', productId: product.id }
          }
        );
        
        if (previewError) {
          console.error("Error generating previews:", previewError);
        } else {
          console.log("Preview generation response:", previewData);
        }
      } catch (previewGenError) {
        console.error("Failed to trigger preview generation:", previewGenError);
        // Не выбрасываем ошибку, так как это некритичная операция
      }

      // Получаем полный продукт с изображениями для уведомления в Telegram
      const { data: productDetails } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*),
          product_videos (*)
        `)
        .eq('id', product.id)
        .single();

      // Отправляем уведомление в Telegram о новом товаре
      if (productDetails) {
        try {
          console.log("Sending Telegram notification for product:", product.id);
          
          const { error: notificationError } = await supabase.functions.invoke(
            'send-telegram-notification', 
            {
              body: { product: productDetails }
            }
          );
          
          if (notificationError) {
            console.error("Error sending Telegram notification:", notificationError);
          }
        } catch (telegramError) {
          console.error("Failed to send Telegram notification:", telegramError);
          // Не выбрасываем ошибку, так как это некритичная операция
        }
      }

      toast({
        title: "Товар добавлен",
        description: "Ваш товар успешно размещен на маркетплейсе",
      });

      navigate('/seller/dashboard');
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Информация о товаре</CardTitle>
                  <CardDescription>
                    Заполните все поля для размещения вашего товара на маркетплейсе
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название товара</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: Передний бампер BMW X5 F15"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Цена ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Информация об автомобиле</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="brandId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Марка автомобиля</FormLabel>
                            <div className="relative">
                              <Input 
                                type="text" 
                                placeholder="Поиск бренда..."
                                value={searchBrandTerm}
                                onChange={(e) => setSearchBrandTerm(e.target.value)}
                                className="mb-1"
                              />
                              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                            <FormControl>
                              <Select
                                disabled={isLoadingCarData}
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger id="brand">
                                  <SelectValue placeholder="Выберите марку" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {filteredBrands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="modelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Модель (необязательно)</FormLabel>
                            <div className="relative">
                              <Input 
                                type="text" 
                                placeholder="Поиск модели..."
                                value={searchModelTerm}
                                onChange={(e) => setSearchModelTerm(e.target.value)}
                                className="mb-1"
                              />
                              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                            <FormControl>
                              <Select
                                disabled={!watchBrandId || isLoadingCarData}
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите модель" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {filteredModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="placeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество мест для отправки</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            placeholder="Количество мест"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание товара (необязательно)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Описание товара"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <Label>Фотографии товара</Label>
                    <RealtimeImageUpload
                      onUploadComplete={handleRealtimeImageUpload}
                      maxImages={10}
                      storageBucket="Product Images" // Исправленное имя bucket
                      storagePath={`products/${user?.id || 'unknown'}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Видео товара (опционально)</Label>
                    <VideoUpload
                      videos={videoUrls}
                      onUpload={setVideoUrls}
                      onDelete={(url) => setVideoUrls(videoUrls.filter((v) => v !== url))}
                      maxVideos={3}
                      storageBucket="Product Images" // Исправленное имя bucket
                      storagePrefix={`products-video/${user?.id || 'unknown'}/`}
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      "Разместить товар"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default SellerAddProduct;
