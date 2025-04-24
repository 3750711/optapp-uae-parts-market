
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
    brand: "",
    model: "",
    lot_number: undefined as number | undefined,
    deliveryMethod: 'self_pickup' as DeliveryMethod,
    place_number: "1",
    text_order: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [orderVideos, setOrderVideos] = useState<string[]>([]);

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
            brand: product.brand || "",
            model: product.model || "",
            lot_number: product.lot_number,
            deliveryMethod: 'self_pickup',
            place_number: "1",
            text_order: "", // Add the missing text_order property
          });

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

      let resolvedProductId = productId;
      let usedLotNumber = formData.lot_number;

      if (!productId) {
        const { data: insertedProducts, error: productError } = await supabase
          .from('products')
          .insert({
            title: formData.title,
            price: parseFloat(formData.price),
            brand: formData.brand,
            model: formData.model,
            seller_id: sellerData.id,
            seller_name: sellerData.full_name || 'Unknown',
            condition: 'new',
          })
          .select();

        if (productError) {
          console.error("Ошибка создания вспомогательного продукта:", productError);
          toast({
            title: "Ошибка",
            description: "Не удалось создать временный товар для заказа",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        if (insertedProducts && insertedProducts.length > 0) {
          resolvedProductId = insertedProducts[0].id;
          usedLotNumber = insertedProducts[0].lot_number;
        }
      } else {
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
      
      const orderPayload = {
        title: formData.title,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        seller_id: sellerData.id,
        order_seller_name: sellerData.full_name || 'Unknown',
        seller_opt_id: formData.sellerOptId,
        buyer_id: user.id,
        buyer_opt_id: profile?.opt_id || null,
        brand: formData.brand,
        model: formData.model,
        status: 'created' as OrderStatus,
        order_created_type: productId ? 'ads_order' as OrderCreatedType : 'free_order' as OrderCreatedType,
        product_id: resolvedProductId || null,
        lot_number_order: usedLotNumber !== undefined ? usedLotNumber : null,
        images: productImages,
        delivery_method: formData.deliveryMethod as DeliveryMethod,
        place_number: parseInt(formData.place_number),
        text_order: formData.text_order || null,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
              <CardDescription>
                Заполните необходимые поля для создания нового заказа
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
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
                    <Label htmlFor="brand">Бренд</Label>
                    <Input 
                      id="brand" 
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Введите бренд"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Модель</Label>
                    <Input 
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="Введите модель"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Цена (AED) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required 
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="place_number">Количество мест для отправки</Label>
                    <Input 
                      id="place_number" 
                      type="number"
                      value={formData.place_number}
                      onChange={(e) => handleInputChange('place_number', e.target.value)}
                      required 
                      min="1"
                      placeholder="Укажите количество мест"
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

                {formData.lot_number !== undefined && (
                  <div className="space-y-2">
                    <Label>Номер лота</Label>
                    <Input value={formData.lot_number ?? ""} readOnly className="bg-gray-100" />
                  </div>
                )}

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
                    value={formData.deliveryMethod}
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
              <CardFooter className="flex justify-end space-x-4">
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
