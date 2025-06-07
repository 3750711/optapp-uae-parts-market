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
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { Database } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

interface CarBrand {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

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
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandModels, setBrandModels] = useState<CarModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Fetch car brands when component mounts
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const { data, error } = await supabase
          .from('car_brands')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching car brands:', error);
        } else {
          setBrands(data || []);
        }
      } catch (err) {
        console.error('Error fetching car brands:', err);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // Fetch models when brand is selected
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedBrandId) {
        setBrandModels([]);
        return;
      }
      
      setLoadingModels(true);
      try {
        const { data, error } = await supabase
          .from('car_models')
          .select('*')
          .eq('brand_id', selectedBrandId)
          .order('name');

        if (error) {
          console.error('Error fetching car models:', error);
        } else {
          setBrandModels(data || []);
        }
      } catch (err) {
        console.error('Error fetching car models:', err);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [selectedBrandId]);

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

  const handleVideoUpload = (urls: string[]) => {
    setOrderVideos(prevUrls => [...prevUrls, ...urls]);
  };

  const handleVideoDelete = (urlToDelete: string) => {
    setOrderVideos(prevUrls => prevUrls.filter(url => url !== urlToDelete));
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

    // Updated price validation to allow 0 and negative prices
    if (!formData.price || isNaN(parseFloat(formData.price))) {
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

      // Find the first missing order number in the sequence
      const { data: existingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: true });

      if (ordersError) {
        console.error("Error getting existing order numbers:", ordersError);
        throw ordersError;
      }

      let nextOrderNumber = 1;
      if (existingOrders && existingOrders.length > 0) {
        // Find the first gap in the sequence
        const orderNumbers = existingOrders.map(order => order.order_number).sort((a, b) => a - b);
        
        for (let i = 0; i < orderNumbers.length; i++) {
          if (orderNumbers[i] !== i + 1) {
            nextOrderNumber = i + 1;
            break;
          }
        }
        
        // If no gap found, use next number after the last one
        if (nextOrderNumber === 1 && orderNumbers.length > 0) {
          nextOrderNumber = orderNumbers[orderNumbers.length - 1] + 1;
        }
      }

      console.log("Next order number will be:", nextOrderNumber);

      const deliveryPrice = formData.delivery_price ? parseFloat(formData.delivery_price) : null;
      
      const orderPayload = {
        order_number: nextOrderNumber,
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
          
          // Вызов новой функции для отправки уведомления о проданном товаре
          try {
            console.log("Отправка уведомления о проданном товаре через новую функцию");
            await supabase.functions.invoke('send-product-sold-notification', {
              body: { productId: resolvedProductId }
            });
            console.log("Уведомление о продаже товара отправлено успешно");
          } catch (notifyError) {
            console.error('Ошибка при отправке уведомления о продаже товара:', notifyError);
            // Не показываем уведомление пользователю, так как заказ всё равно создан успешно
          }
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

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Создать заказ</CardTitle>
            <CardDescription>
              Заполните информацию о заказе для отправки продавцу
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Наименование *</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required 
                    placeholder="Введите наименование"
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Марка</Label>
                  <Select
                    value={selectedBrandId || ""}
                    onValueChange={setSelectedBrandId}
                    disabled={loadingBrands}
                  >
                    <SelectTrigger id="brand">
                      <SelectValue placeholder="Выберите марку" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Модель</Label>
                  <Select
                    value={selectedModelId || ""}
                    onValueChange={setSelectedModelId}
                    disabled={!selectedBrandId || loadingModels}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Выберите модель" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    step="0.01"
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
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>OPT_ID продавца</Label>
                  <Input 
                    value={formData.sellerOptId}
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>OPT_ID покупателя</Label>
                <Input 
                  value={profile?.opt_id || ''} 
                  readOnly 
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label>Телеграм покупателя</Label>
                <Input 
                  value={profile?.telegram || ''} 
                  readOnly 
                  className="bg-gray-100"
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
                <Label>Видео товара</Label>
                <CloudinaryVideoUpload
                  videos={orderVideos}
                  onUpload={handleVideoUpload}
                  onDelete={handleVideoDelete}
                  maxVideos={3}
                  productId={productId || undefined}
                  buttonText="Загрузить видео товара"
                />
              </div>

              <div className="space-y-2">
                <Label>Способ доставки</Label>
                <Select
                  value="self_pickup"
                  onValueChange={(value: DeliveryMethod) => handleInputChange('deliveryMethod', value)}
                >
                  <SelectTrigger>
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
                />
              </div>

              <div className="space-y-2">
                <Label>Дополнительное описание</Label>
                <Textarea
                  value={formData.text_order}
                  onChange={(e) => handleInputChange('text_order', e.target.value)}
                  placeholder="Дополнительная информация о заказе..."
                  className="min-h-[100px]"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Создание заказа..." : "Создать заказ"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default BuyerCreateOrder;
