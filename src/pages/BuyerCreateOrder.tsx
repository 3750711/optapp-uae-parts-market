import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ImageUpload } from "@/components/ui/image-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { Database } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BrandModelSelector } from "@/components/product/BrandModelSelector";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

const BuyerCreateOrder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    quantity: "1",
    sellerOptId: "",
    place_number: "1",
    text_order: "",
    delivery_price: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [orderVideos, setOrderVideos] = useState<string[]>([]);
  
  // Car brands and models state
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      console.log("Fetched profile data:", data);
      
      if (data) {
        console.log("Profile data fetched:", data);
      } else {
        console.error('No profile data found for user:', userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (productId) {
        const { data: product, error } = await supabase
          .from('products')
          .select('*, product_images(url)')
          .eq('id', productId)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить данные товара",
            variant: "destructive",
          });
          return;
        }

        if (product) {
          setFormData({
            title: product.title,
            price: product.price.toString(),
            quantity: "1",
            sellerOptId: product.optid_created || "",
            place_number: product.place_number ? product.place_number.toString() : "1",
            text_order: "",
            delivery_price: product.delivery_price ? product.delivery_price.toString() : "",
          });

          // Find matching brand ID and set it
          if (product.brand) {
            const { data: brandData } = await supabase
              .from('car_brands')
              .select('*')
              .eq('name', product.brand)
              .single();
              
            if (brandData) {
              setSelectedBrandId(brandData.id);
              
              // Then fetch models for this brand
              if (product.model) {
                const { data: modelData } = await supabase
                  .from('car_models')
                  .select('*')
                  .eq('brand_id', brandData.id)
                  .eq('name', product.model)
                  .single();
                  
                if (modelData) {
                  setSelectedModelId(modelData.id);
                }
              }
            }
          }

          const { data: images, error: imagesError } = await supabase
            .from('product_images')
            .select('url')
            .eq('product_id', productId);

          if (imagesError) {
            console.error('Error fetching product images:', imagesError);
          } else if (images && images.length > 0) {
            setProductImages(images.map(img => img.url));
            console.log('Found product images:', images.map(img => img.url));
          }
        }
      }
    };

    fetchProductData();
  }, [productId, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания заказа",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Ошибка",
        description: "Наименование обязательно для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Ошибка",
        description: "Укажите корректную цену",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBrandId || !selectedModelId) {
      toast({
        title: "Ошибка",
        description: "Выберите марку и модель автомобиля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('opt_id', formData.sellerOptId)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (!sellerData?.id) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти продавца с указанным OPT ID",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get the brand and model names for storage
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      const selectedModel = brandModels.find(m => m.id === selectedModelId);
      
      if (!selectedBrand || !selectedModel) {
        toast({
          title: "Ошибка",
          description: "Выбранная марка или модель недоступна",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let resolvedProductId = productId;
      let usedLotNumber = undefined;

      if (productId) {
        const { data: currentProduct, error: productCheckError } = await supabase
          .from('products')
          .select('status')
          .eq('id', productId)
          .single();
          
        if (productCheckError) {
          console.error('Error checking product status:', productCheckError);
          throw new Error('Failed to verify product availability');
        }
        
        if (currentProduct.status !== 'active') {
          toast({
            title: "Товар недоступен",
            description: "Этот товар уже продан или недоступен для заказа",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      console.log("Preparing to create order with product_id:", resolvedProductId);

      const deliveryPrice = formData.delivery_price ? parseFloat(formData.delivery_price) : null;
      
      const orderPayload = {
        title: formData.title,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        seller_id: sellerData.id,
        order_seller_name: sellerData.full_name || 'Unknown',
        seller_opt_id: formData.sellerOptId,
        buyer_id: user.id,
        buyer_opt_id: profile?.opt_id || null,
        brand: selectedBrand.name,
        model: selectedModel.name,
        status: 'created' as OrderStatus,
        order_created_type: productId ? ('ads_order' as OrderCreatedType) : ('free_order' as OrderCreatedType),
        product_id: resolvedProductId || null,
        images: productImages,
        delivery_method: 'self_pickup' as DeliveryMethod,
        place_number: parseInt(formData.place_number),
        text_order: formData.text_order || null,
        delivery_price_confirm: deliveryPrice,
      };

      console.log("Order payload:", orderPayload);

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Created order:", createdOrder);

      if (orderVideos.length > 0 && createdOrder && createdOrder[0]?.id) {
        console.log("Saving videos to order_videos table, order ID:", createdOrder[0].id);
        const videoRecords = orderVideos.map(url => ({
          order_id: createdOrder[0].id,
          url
        }));
        
        const { error: videosError } = await supabase
          .from('order_videos')
          .insert(videoRecords);
          
        if (videosError) {
          console.error("Error saving video references:", videosError);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но возникла проблема с сохранением видео",
            variant: "destructive"
          });
        } else {
          console.log("Video references saved successfully");
        }
      }

      if (resolvedProductId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ status: 'sold' })
          .eq('id', resolvedProductId);

        if (updateError) {
          console.error("Error updating product status:", updateError);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но статус товара не обновился. Пожалуйста, сообщите администратору.",
            variant: "destructive",
          });
        } else {
          console.log("Product status updated to sold successfully");
        }
      }

      // Send notification to Telegram with explicit 'create' action
      try {
        console.log("Sending Telegram notification for new order creation");
        await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...createdOrder[0], images: productImages },
            action: 'create'
          }
        });
        console.log("Telegram notification sent for new order");
      } catch (notifyError) {
        console.error('Failed to send order notification:', notifyError);
      }

      toast({
        title: "Заказ создан",
        description: "Ваш заказ был успешно создан",
      });

      navigate('/orders');
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании заказа",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle brand and model selection
  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedModelId(null); // Reset model when brand changes
  };

  const handleModelChange = (modelId: string | undefined) => {
    setSelectedModelId(modelId || null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-md rounded-lg overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <CardTitle>Информация о заказе</CardTitle>
              <CardDescription>
                Заполните необходимые поля для создания нового заказа
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Наименование *</Label>
                    <Input 
                      id="title" 
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required 
                      placeholder="Введите наименование"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Количество единиц товара</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      required 
                      min="1"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Марка и модель автомобиля</Label>
                  <BrandModelSelector 
                    selectedBrandId={selectedBrandId || ""}
                    selectedModelId={selectedModelId || undefined}
                    onBrandChange={handleBrandChange}
                    onModelChange={handleModelChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена ($) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required 
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_price">Стоимость доставки ($)</Label>
                    <Input 
                      id="delivery_price"
                      type="number"
                      value={formData.delivery_price}
                      onChange={(e) => handleInputChange('delivery_price', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>OPT_ID продавца</Label>
                    <Input 
                      value={formData.sellerOptId}
                      readOnly 
                      className="bg-gray-100 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>OPT_ID покупателя</Label>
                  <Input 
                    value={profile?.opt_id || ''} 
                    readOnly 
                    className="bg-gray-100 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Телеграм покупателя</Label>
                  <Input 
                    value={profile?.telegram || ''} 
                    readOnly 
                    className="bg-gray-100 h-10"
                  />
                </div>

                {productImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Изображения товара</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {productImages.map((url, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-md border">
                          <img 
                            src={url} 
                            alt={`Изображение товара ${index + 1}`} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Видео заказа</Label>
                  <VideoUpload
                    videos={orderVideos}
                    onUpload={(urls) => setOrderVideos((prev) => [...prev, ...urls])}
                    onDelete={(url) => setOrderVideos((prev) => prev.filter(u => u !== url))}
                    maxVideos={2}
                    storageBucket="order-videos"
                    storagePrefix=""
                  />
                </div>

                <div className="space-y-2">
                  <Label>Способ доставки</Label>
                  <Select
                    value="self_pickup"
                    onValueChange={(value: DeliveryMethod) => handleInputChange('deliveryMethod', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Выберите способ доставки" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self_pickup">Самовывоз</SelectItem>
                      <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
                      <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="place_number">Количество мест для отправки</Label>
                  <Input 
                    id="place_number"
                    type="number"
                    min="1"
                    value={formData.place_number}
                    onChange={(e) => handleInputChange('place_number', e.target.value)}
                    placeholder="Укажите количество мест"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Дополнительная информация</Label>
                  <Textarea 
                    placeholder="Укажите дополнительную информацию по заказу (необязательно)"
                    className="resize-none"
                    rows={3}
                    value={formData.text_order}
                    onChange={(e) => handleInputChange('text_order', e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4 p-6 bg-gray-50 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Отмена
                </Button>
                <Button 
                  type="submit"
                  className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Создание..." : "Создать заказ"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerCreateOrder;
