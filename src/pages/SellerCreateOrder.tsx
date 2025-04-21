import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ImageUpload } from "@/components/ui/image-upload";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import { Database } from "@/integrations/supabase/types";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import VideoUpload from "@/components/ui/video-upload";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

type ProfileShort = {
  id: string;
  opt_id: string;
  full_name?: string | null;
};

const SellerCreateOrder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [profiles, setProfiles] = useState<ProfileShort[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    quantity: "1",
    buyerOptId: "",
    brand: "",
    model: "",
    optid_created: "",
    seller_opt_id: "",
    buyer_opt_id: ""
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        console.log("Fetching profiles with opt_id (buyers only)...");
        const { data, error } = await supabase
          .from("profiles")
          .select("id, opt_id, full_name")
          .eq("user_type", "buyer")
          .not("opt_id", "is", null);
        
        if (error) {
          console.error("Ошибка загрузки списка OPT_ID:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить список OPT_ID",
            variant: "destructive",
          });
          return;
        }
        
        console.log("Fetched profiles:", data?.length || 0);
        setProfiles(data || []);
      } catch (error) {
        console.error("Unexpected error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  useEffect(() => {
    const fetchProductData = async () => {
      if (productId) {
        const { data: product, error } = await supabase
          .from('products')
          .select('*, seller:profiles!products_seller_id_fkey(opt_id)')
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
          console.log('Product data loaded:', product);
          setFormData({
            title: product.title,
            price: product.price.toString(),
            quantity: "1",
            buyerOptId: "",
            brand: product.brand || "",
            model: product.model || "",
            optid_created: product.optid_created || "",
            seller_opt_id: product.seller?.opt_id || "",
            buyer_opt_id: ""
          });
        }
      }
    };

    fetchProductData();
  }, [productId]);

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

    try {
      const { data: buyerData, error: buyerError } = await supabase
        .from('profiles')
        .select('id, full_name, telegram')
        .eq('opt_id', formData.buyerOptId)
        .maybeSingle();

      if (buyerError) throw buyerError;

      if (!buyerData?.id) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти получателя с указанным OPT ID",
          variant: "destructive",
        });
        return;
      }

      console.log("Working with product ID:", productId);
      let resolvedProductId = productId;

      if (!productId) {
        console.log("Creating temporary product for the order");
        const { data: productInsert, error: productError } = await supabase
          .from('products')
          .insert({
            title: formData.title,
            price: parseFloat(formData.price),
            brand: formData.brand,
            model: formData.model,
            seller_id: user.id,
            seller_name: profile?.full_name || 'Unknown',
            condition: 'new',
          })
          .select();

        if (productError) {
          console.error("Ошибка создания товара для заказа:", productError);
          toast({
            title: "Ошибка",
            description: "Не удалось создать временный товар для заказа",
            variant: "destructive",
          });
          return;
        }
        
        if (productInsert && productInsert.length > 0) {
          resolvedProductId = productInsert[0].id;
          console.log("Created temporary product with ID:", resolvedProductId);
        } else {
          console.error("No product was created");
        }
      }

      console.log("Preparing to create order with product_id:", resolvedProductId);

      const orderPayload = {
        title: formData.title,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        seller_id: user.id,
        order_seller_name: profile?.full_name || 'Unknown',
        seller_opt_id: profile?.opt_id || null,
        buyer_id: buyerData.id,
        buyer_opt_id: formData.buyerOptId,
        brand: formData.brand,
        model: formData.model,
        status: 'seller_confirmed' as OrderStatus,
        order_created_type: productId ? ('ads_order' as OrderCreatedType) : ('free_order' as OrderCreatedType),
        telegram_url_order: buyerData.telegram || null,
        images: images,
        product_id: resolvedProductId || null,
      };

      console.log("Order payload:", orderPayload);

      const { data: createdOrderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      const createdOrder = createdOrderData?.[0];
      console.log("Created order:", createdOrder);

      if (!createdOrder) {
        throw new Error("Order was created but no data was returned");
      }

      if (images.length > 0) {
        const { error: imagesError } = await supabase
          .from('order_images')
          .insert(
            images.map((url, index) => ({
              order_id: createdOrder.id,
              url,
              is_primary: index === 0
            }))
          );

        if (imagesError) throw imagesError;
      }

      if (videos.length > 0 && createdOrder?.id) {
        const { error: videosError } = await supabase
          .from('order_videos')
          .insert(
            videos.map((url) => ({
              order_id: createdOrder.id,
              url
            }))
          );
        if (videosError) throw videosError;
      }

      setCreatedOrder(createdOrder);
      toast({
        title: "Заказ создан",
        description: "Ваш заказ был успешно создан",
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании заказа",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const handleImageDelete = (urlToDelete: string) => {
    setImages(prev => prev.filter(url => url !== urlToDelete))
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrderUpdate = (updatedOrder: any) => {
    setCreatedOrder(updatedOrder);
  };

  if (createdOrder) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => navigate('/seller/dashboard')}
              className="mr-4"
            >
              Вернуться в панель
            </Button>
            <Button 
              onClick={() => {
                setCreatedOrder(null);
                setFormData({
                  title: "",
                  price: "",
                  quantity: "1",
                  buyerOptId: "",
                  brand: "",
                  model: "",
                  optid_created: "",
                  seller_opt_id: "",
                  buyer_opt_id: ""
                });
                setImages([]);
              }}
            >
              Создать новый заказ
            </Button>
          </div>
          <OrderConfirmationCard 
            order={createdOrder} 
            images={images}
            onOrderUpdate={handleOrderUpdate}
          />
        </div>
      </Layout>
    );
  }

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
                    <Label htmlFor="quantity">Количество мест</Label>
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
                    <Label htmlFor="buyerOptId">OPT_ID получателя *</Label>
                    <Select
                      value={formData.buyerOptId}
                      onValueChange={(value: string) => handleInputChange("buyerOptId", value)}
                      required
                    >
                      <SelectTrigger id="buyerOptId" className="bg-white">
                        <SelectValue placeholder="Выберите OPT_ID" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.length === 0 ? (
                          <SelectItem value="no_data">Нет данных</SelectItem>
                        ) : (
                          profiles.map((p) => (
                            <SelectItem key={p.opt_id} value={p.opt_id}>
                              {p.opt_id} {p.full_name ? `- ${p.full_name}` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Имя отправителя</Label>
                  <Input 
                    value={profile?.full_name || 'Неизвестный продавец'} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OPT_ID отправителя</Label>
                  <Input 
                    value={formData.seller_opt_id || profile?.opt_id || ''} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OPT_ID покупателя</Label>
                  <Input 
                    value={formData.buyer_opt_id} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Телеграм отправителя</Label>
                  <Input 
                    value={profile?.telegram || ''} 
                    readOnly 
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Фотографии заказа</Label>
                  <ImageUpload
                    images={images}
                    onUpload={handleImageUpload}
                    onDelete={handleImageDelete}
                    maxImages={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Видео заказа</Label>
                  <VideoUpload
                    videos={videos}
                    onUpload={(urls) => setVideos((prev) => [...prev, ...urls])}
                    onDelete={(url) => setVideos((prev) => prev.filter(u => u !== url))}
                    maxVideos={2}
                    storageBucket="order-videos"
                    storagePrefix=""
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
                >
                  Создать заказ
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellerCreateOrder;
