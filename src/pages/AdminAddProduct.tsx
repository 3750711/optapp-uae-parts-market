import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Check } from "lucide-react";
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
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { Progress } from "@/components/ui/progress";
import { STORAGE_BUCKETS } from "@/constants/storage";

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
  sellerId: z.string().min(1, {
    message: "Выберите продавца",
  }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "Стоимость доставки должна быть числом",
  }),
});

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellers, setSellers] = useState<{ id: string; full_name: string }[]>([]);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [searchSellerTerm, setSearchSellerTerm] = useState("");
  const [progressStatus, setProgressStatus] = useState({ step: "", progress: 0 });
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [productCreated, setProductCreated] = useState(false);
  
  // Use our custom hook for car brands and models
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    validateModelBrand 
  } = useCarBrandsAndModels();

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    brandModels,
    findBrandIdByName,
    findModelIdByName
  );

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: "",
      brandId: "",
      modelId: "",
      placeNumber: "1",
      sellerId: "",
      description: "",
      deliveryPrice: "0",
    },
    mode: "onChange", // Enable validation on change
  });

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  // Filter models based on search term
  const filteredModels = brandModels.filter(model => 
    model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
  );

  // Filter sellers based on search term
  const filteredSellers = sellers.filter(seller => 
    (seller.full_name || "").toLowerCase().includes(searchSellerTerm.toLowerCase())
  );

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

  // Fetch sellers (only sellers, not buyers or admins)
  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_type', 'seller');

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

  // When brand changes, reset model selection and update models list
  useEffect(() => {
    if (watchBrandId) {
      selectBrand(watchBrandId);
      
      // Only reset model if the brand has changed and we have a selected model
      if (watchModelId) {
        const modelBelongsToBrand = validateModelBrand(watchModelId, watchBrandId);
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "");
        }
      }
    }
  }, [watchBrandId, selectBrand, form, validateModelBrand, watchModelId]);

  // Validate model when brandModels change (to handle async loading)
  useEffect(() => {
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [brandModels, watchModelId, form]);

  // NEW: Create product FIRST, before image upload
  const createProductFirst = async (values: z.infer<typeof productSchema>) => {
    if (productCreated) {
      toast({
        title: "Товар уже создан",
        description: "Товар уже был создан. Добавляйте изображения или завершите публикацию.",
      });
      return;
    }

    setIsSubmitting(true);
    setProgressStatus({ step: "Создание товара", progress: 10 });

    try {
      // Get brand and model names for the database
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
      
      // Model is optional, handle it accordingly
      let modelName = null;
      if (values.modelId) {
        const selectedModel = brandModels.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      if (!selectedBrand || !selectedSeller) {
        toast({
          title: "Ошибка",
          description: "Выбранная марка или продавец не найдены",
          variant: "destructive",
        });
        return;
      }

      setProgressStatus({ step: "Сохранение данных товара", progress: 30 });
      
      console.log('🏭 Creating product with RPC...', {
        title: values.title,
        sellerId: values.sellerId,
        timestamp: new Date().toISOString()
      });
      
      // Using RPC to create the product using admin permissions
      const { data: productId, error: productError } = await supabase
        .rpc('admin_create_product', {
          p_title: values.title,
          p_price: parseFloat(values.price),
          p_condition: "Новый",
          p_brand: selectedBrand.name,
          p_model: modelName,
          p_description: values.description || null,
          p_seller_id: values.sellerId,
          p_seller_name: selectedSeller.full_name || "Unknown Seller",
          p_status: 'active',
          p_place_number: parseInt(values.placeNumber),
          p_delivery_price: values.deliveryPrice ? parseFloat(values.deliveryPrice) : 0,
        });

      if (productError) {
        console.error("Error creating product via RPC:", productError);
        throw productError;
      }

      if (!productId) {
        throw new Error("Failed to get product ID");
      }

      console.log('✅ Product created successfully:', {
        productId,
        title: values.title,
        timestamp: new Date().toISOString()
      });

      setCreatedProductId(productId);
      setProductCreated(true);
      setProgressStatus({ step: "Товар создан! Теперь добавьте изображения", progress: 50 });
      
      toast({
        title: "Товар создан",
        description: "Товар успешно создан. Теперь добавьте изображения и видео, затем завершите публикацию.",
      });

    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать товар. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileOptimizedImageUpload = (urls: string[]) => {
    console.log('📷 New images uploaded:', {
      urls,
      existingCount: imageUrls.length,
      productId: createdProductId,
      timestamp: new Date().toISOString()
    });
    
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    // Set default primary image if none is selected yet
    if (!primaryImage && urls.length > 0) {
      console.log('🎯 Setting primary image:', urls[0]);
      setPrimaryImage(urls[0]);
    }
  };

  const removeImage = (url: string) => {
    const newImageUrls = imageUrls.filter(item => item !== url);
    setImageUrls(newImageUrls);
    
    // If deleted image was primary, set new primary
    if (primaryImage === url) {
      if (newImageUrls.length > 0) {
        setPrimaryImage(newImageUrls[0]);
      } else {
        setPrimaryImage("");
      }
    }
  };

  // Replacement function for sending notification
  const sendNotificationWithRetry = async (product: any) => {
    try {
      const { error } = await supabase.functions.invoke("send-telegram-notification", {
        body: { productId: product.id }
      });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  };

  // MODIFIED: Final publish (associate images and videos, send notification)
  const finalizePublication = async () => {
    if (!createdProductId) {
      toast({
        title: "Ошибка",
        description: "Сначала создайте товар",
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
    setProgressStatus({ step: "Сохранение изображений", progress: 70 });

    try {
      // Images are already uploaded, we just need to associate them with the product
      for (const url of imageUrls) {
        const { error: imageError } = await supabase
          .rpc('admin_insert_product_image', {
            p_product_id: createdProductId,
            p_url: url,
            p_is_primary: url === primaryImage
          });
          
        if (imageError) throw imageError;
      }
      
      setProgressStatus({ step: "Сохранение видео", progress: 85 });

      if (videoUrls.length > 0) {
        // Use RPC to insert videos as admin
        for (const videoUrl of videoUrls) {
          const { error: videoError } = await supabase
            .rpc('admin_insert_product_video', {
              p_product_id: createdProductId,
              p_url: videoUrl
            });
            
          if (videoError) throw videoError;
        }
      }

      // Получаем полные данные о продукте со всеми изображениями
      const { data: fullProduct, error: fetchError } = await supabase
        .from('products')
        .select(`*, product_images(*)`)
        .eq('id', createdProductId)
        .single();
      
      if (fetchError) {
        console.warn("Ошибка при получении полных данных о продукте:", fetchError);
      }
      
      setProgressStatus({ step: "Отправка уведомления в Telegram", progress: 95 });
      
      // Отправляем уведомление в Telegram асинхронно
      try {
        if (fullProduct) {
          sendNotificationWithRetry(fullProduct).catch(notifyError => {
            console.error("Ошибка асинхронной отправки уведомления:", notifyError);
          });
        } else {
          supabase.functions.invoke('send-telegram-notification', {
            body: { productId: createdProductId }
          }).catch(notifyError => {
            console.error("Ошибка прямого вызова функции отправки уведомления:", notifyError);
          });
        }
      } catch (notifyError) {
        console.warn("Ошибка при запуске отправки уведомления (не критично):", notifyError);
      }
      
      setProgressStatus({ step: "Завершение", progress: 100 });

      toast({
        title: "Товар опубликован",
        description: "Товар успешно опубликован на маркетплейсе с автоматической генерацией превью", 
      });

      navigate(`/product/${createdProductId}`);
    } catch (error) {
      console.error("Error finalizing publication:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить публикацию товара. Попробуйте позже.",
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
  }, [imageUrls]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(createProductFirst)}>
              <Card>
                <CardHeader>
                  <CardTitle>Информация о товаре</CardTitle>
                  <CardDescription>
                    {!productCreated 
                      ? "Заполните все поля и создайте товар, затем добавьте изображения"
                      : "Товар создан! Теперь добавьте изображения и завершите публикацию"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Продавец</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={productCreated}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите продавца" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent 
                            className="max-h-[300px]"
                            showSearch={true}
                            searchPlaceholder="Поиск продавца..."
                            searchValue={searchSellerTerm}
                            onSearchChange={setSearchSellerTerm}
                          >
                            {filteredSellers.length === 0 ? (
                              <div className="p-2 text-center text-sm text-gray-500">
                                Продавцы не найдены
                              </div>
                            ) : (
                              filteredSellers.map((seller) => (
                                <SelectItem key={seller.id} value={seller.id}>
                                  {seller.full_name || "Продавец без имени"}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                              disabled={productCreated}
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
                                placeholder="0.00"
                                disabled={productCreated}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Стоимость доставки ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00"
                                disabled={productCreated}
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
                            <FormLabel>Марка</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={isLoadingCarData || productCreated}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите марку" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent 
                                className="max-h-[300px]"
                                showSearch={true}
                                searchPlaceholder="Поиск марки..."
                                searchValue={searchBrandTerm}
                                onSearchChange={setSearchBrandTerm}
                              >
                                {filteredBrands.length === 0 ? (
                                  <div className="p-2 text-center text-sm text-gray-500">
                                    Марки не найдены
                                  </div>
                                ) : (
                                  filteredBrands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
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
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ""}
                              disabled={!watchBrandId || isLoadingCarData || brandModels.length === 0 || productCreated}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите модель (необязательно)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent 
                                className="max-h-[300px]"
                                showSearch={true}
                                searchPlaceholder="Поиск модели..."
                                searchValue={searchModelTerm}
                                onSearchChange={setSearchModelTerm}
                              >
                                {brandModels.length === 0 && watchBrandId ? (
                                  <SelectItem value="loading" disabled>Загрузка моделей...</SelectItem>
                                ) : filteredModels.length === 0 ? (
                                  <div className="p-2 text-center text-sm text-gray-500">
                                    Модели не найдены
                                  </div>
                                ) : (
                                  filteredModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
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
                        <FormLabel>Количество мест</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1"
                            disabled={productCreated}
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
                            disabled={productCreated}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!productCreated && (
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание товара...
                        </>
                      ) : (
                        'Создать товар'
                      )}
                    </Button>
                  )}
                  
                  {productCreated && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center gap-2 text-green-800">
                          <Check className="h-4 w-4" />
                          <span className="font-medium">Товар создан успешно!</span>
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          ID товара: {createdProductId}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="images">Фотографии товара</Label>
                        
                        <MobileOptimizedImageUpload
                          onUploadComplete={handleMobileOptimizedImageUpload}
                          maxImages={30}
                          existingImages={imageUrls}
                          onImageDelete={removeImage}
                          onSetPrimaryImage={setPrimaryImage}
                          primaryImage={primaryImage}
                          productId={createdProductId}
                        />
                        
                        <div className="text-xs text-green-600 space-y-1">
                          <div>📸 Изображения автоматически сжимаются до 400KB</div>
                          <div className="font-medium">🖼️ Превью 20KB создаётся автоматически для каждого изображения (ID: {createdProductId})</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="videos">Видео товара (необязательно)</Label>
                        <VideoUpload
                          videos={videoUrls}
                          onUpload={(urls) => setVideoUrls(prevUrls => [...prevUrls, ...urls])}
                          onDelete={(urlToDelete) => setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete))}
                          maxVideos={2}
                          storageBucket="product-images"
                        />
                      </div>
                      
                      <Button 
                        type="button"
                        onClick={finalizePublication}
                        className="w-full"
                        disabled={isSubmitting || imageUrls.length === 0}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Завершение публикации...
                          </>
                        ) : (
                          'Завершить публикацию'
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
                
                {isSubmitting && (
                  <div className="px-6 pb-4">
                    <div className="mb-2 flex justify-between items-center">
                      <span className="text-sm font-medium">{progressStatus.step || "Обработка..."}</span>
                      <span className="text-sm">{progressStatus.progress}%</span>
                    </div>
                    <Progress value={progressStatus.progress} className="h-2" />
                  </div>
                )}
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddProduct;
