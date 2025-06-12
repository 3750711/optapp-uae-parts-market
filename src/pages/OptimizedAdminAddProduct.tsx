
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedAdminAddProductData } from "@/hooks/useOptimizedAdminAddProductData";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Simplified product schema for admin
const adminProductSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  price: z.string().min(1, "Цена обязательна"),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  placeNumber: z.string().min(1, "Количество мест обязательно"),
  description: z.string().optional(),
  deliveryPrice: z.string().optional(),
  sellerId: z.string().min(1, "Выберите продавца"),
});

type AdminProductFormValues = z.infer<typeof adminProductSchema>;

const OptimizedAdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  
  // Получаем все данные одним запросом
  const { data: formData, isLoading, error } = useOptimizedAdminAddProductData();
  
  // Мемоизируем обработанные данные
  const { brands, models, sellers } = useMemo(() => {
    if (!formData) {
      return { brands: [], models: [], sellers: [] };
    }
    
    return {
      brands: formData.brands || [],
      models: formData.models || [],
      sellers: formData.sellers || []
    };
  }, [formData]);

  // Инициализируем парсер заголовков
  const { parseProductTitle } = useProductTitleParser(
    brands,
    models,
    (name: string) => brands.find(b => b.name.toLowerCase() === name.toLowerCase())?.id,
    (name: string) => models.find(m => m.name.toLowerCase() === name.toLowerCase())?.id
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

  // Мемоизируем фильтрацию моделей по бренду
  const filteredModels = useMemo(() => {
    if (!watchBrandId || !models.length) return [];
    return models.filter(model => model.brand_id === watchBrandId);
  }, [models, watchBrandId]);

  // Автоматическое определение бренда и модели из названия
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
  }, [watchTitle, brands, parseProductTitle, form, watchBrandId, toast]);

  // Сброс модели при смене бренда
  useEffect(() => {
    if (watchBrandId && watchModelId) {
      const modelBelongsToBrand = models.some(
        model => model.id === watchModelId && model.brand_id === watchBrandId
      );
      if (!modelBelongsToBrand) {
        form.setValue("modelId", "");
      }
    }
  }, [watchBrandId, watchModelId, models, form]);

  // Оптимизированная загрузка изображений
  const handleImageUpload = useCallback((urls: string[]) => {
    console.log('📷 New images uploaded:', urls);
    
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  }, [primaryImage]);

  const removeImage = useCallback((url: string) => {
    const newImageUrls = imageUrls.filter(item => item !== url);
    setImageUrls(newImageUrls);
    
    if (primaryImage === url) {
      setPrimaryImage(newImageUrls[0] || "");
    }
  }, [imageUrls, primaryImage]);

  // Создание товара
  const createProduct = async (values: AdminProductFormValues) => {
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
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
      let modelName = null;
      
      if (values.modelId) {
        const selectedModel = models.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      if (!selectedBrand || !selectedSeller) {
        toast({
          title: "Ошибка",
          description: "Проверьте выбранные данные",
          variant: "destructive",
        });
        return;
      }

      // Создаем товар
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

      // Добавляем изображения
      for (const url of imageUrls) {
        const { error: imageError } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            url: url,
            is_primary: url === primaryImage
          });
          
        if (imageError) {
          console.error('Error adding image:', imageError);
        }
      }

      // Обновляем Cloudinary данные
      if (primaryImage) {
        try {
          const publicIdMatch = primaryImage.match(/\/v\d+\/(.+?)(?:\.|$)/);
          const publicId = publicIdMatch ? publicIdMatch[1] : null;
          
          if (publicId) {
            await supabase
              .from('products')
              .update({
                cloudinary_public_id: publicId,
                cloudinary_url: primaryImage
              })
              .eq('id', product.id);
          }
        } catch (error) {
          console.error('Error processing Cloudinary data:', error);
        }
      }

      // Добавляем видео
      if (videoUrls.length > 0) {
        for (const videoUrl of videoUrls) {
          await supabase
            .from('product_videos')
            .insert({
              product_id: product.id,
              url: videoUrl
            });
        }
      }

      toast({
        title: "Товар создан",
        description: `Товар успешно опубликован для ${selectedSeller.full_name}`,
      });

      navigate(`/product/${product.id}`);
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Загрузка данных формы...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">Ошибка загрузки данных: {error.message}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Перезагрузить
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <form onSubmit={form.handleSubmit(createProduct)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sellerId">Продавец *</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("sellerId", value)}
                      value={form.watch("sellerId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите продавца..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sellers.map(seller => (
                          <SelectItem key={seller.id} value={seller.id}>
                            {seller.full_name} ({seller.opt_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.sellerId && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.sellerId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price">Цена *</Label>
                    <Input
                      {...form.register("price")}
                      type="number"
                      placeholder="Введите цену"
                    />
                    {form.formState.errors.price && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.price.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Название товара *</Label>
                  <Input
                    {...form.register("title")}
                    placeholder="Введите название товара"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandId">Марка автомобиля</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("brandId", value)}
                      value={form.watch("brandId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите марку..." />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map(brand => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="modelId">Модель автомобиля</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("modelId", value)}
                      value={form.watch("modelId")}
                      disabled={!watchBrandId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите модель..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredModels.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="placeNumber">Количество мест *</Label>
                    <Input
                      {...form.register("placeNumber")}
                      type="number"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryPrice">Стоимость доставки</Label>
                    <Input
                      {...form.register("deliveryPrice")}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    {...form.register("description")}
                    rows={3}
                    placeholder="Описание товара"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Фотографии товара</CardTitle>
              </CardHeader>
              <CardContent>
                {!showImageUpload ? (
                  <Button
                    type="button"
                    onClick={() => setShowImageUpload(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Добавить фотографии
                  </Button>
                ) : (
                  <div>
                    {/* Здесь будет компонент загрузки изображений */}
                    <p className="text-sm text-gray-600">
                      Компонент загрузки изображений загружается...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/products')}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать товар'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OptimizedAdminAddProduct;
