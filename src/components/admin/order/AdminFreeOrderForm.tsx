
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/ui/image-upload";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import { Database } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoUpload } from "@/components/ui/video-upload";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

type ProfileShort = {
  id: string;
  opt_id: string;
  full_name?: string | null;
};

type SellerProfile = {
  id: string;
  full_name?: string | null;
  opt_id?: string | null;
  telegram?: string | null;
};

export const AdminFreeOrderForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [buyerProfiles, setBuyerProfiles] = useState<ProfileShort[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    buyerOptId: "",
    brand: "",
    model: "",
    sellerId: "",
    deliveryMethod: 'self_pickup' as DeliveryMethod,
    place_number: "1",
    text_order: "",
    delivery_price: "",
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Fetch buyer profiles
        const { data: buyersData, error: buyersError } = await supabase
          .from("profiles")
          .select("id, opt_id, full_name")
          .eq("user_type", "buyer")
          .not("opt_id", "is", null);
        
        if (buyersError) {
          console.error("Ошибка загрузки списка OPT_ID покупателей:", buyersError);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить список OPT_ID покупателей",
            variant: "destructive",
          });
          return;
        }
        
        setBuyerProfiles(buyersData || []);
        
        // Fetch seller profiles
        const { data: sellersData, error: sellersError } = await supabase
          .from("profiles")
          .select("id, opt_id, full_name, telegram")
          .eq("user_type", "seller");
        
        if (sellersError) {
          console.error("Ошибка загрузки списка продавцов:", sellersError);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить список продавцов",
            variant: "destructive",
          });
          return;
        }
        
        setSellerProfiles(sellersData || []);
      } catch (error) {
        console.error("Unexpected error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'sellerId' && value) {
      const seller = sellerProfiles.find(s => s.id === value);
      setSelectedSeller(seller || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания заказа",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Ошибка",
        description: "Наименование обязательно для заполнения",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Ошибка",
        description: "Укажите корректную цену",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.sellerId) {
      toast({
        title: "Ошибка",
        description: "Выберите продавца",
        variant: "destructive",
      });
      setIsLoading(false);
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
        setIsLoading(false);
        return;
      }

      const deliveryPrice = formData.delivery_price ? parseFloat(formData.delivery_price) : null;
      
      // Обновлено: добавляем префикс p_ к каждому параметру
      const orderPayload = {
        p_title: formData.title,
        p_price: parseFloat(formData.price),
        p_place_number: parseInt(formData.place_number),
        p_seller_id: formData.sellerId,
        p_order_seller_name: selectedSeller?.full_name || 'Unknown',
        p_seller_opt_id: selectedSeller?.opt_id || null,
        p_buyer_id: buyerData.id,
        p_brand: formData.brand,
        p_model: formData.model,
        p_status: 'seller_confirmed' as OrderStatus,
        p_order_created_type: 'free_order' as OrderCreatedType,
        p_telegram_url_order: selectedSeller?.telegram || null,
        p_images: images,
        p_product_id: null,
        p_delivery_method: formData.deliveryMethod as DeliveryMethod,
        p_text_order: formData.text_order || null,
        p_delivery_price_confirm: deliveryPrice,
      };

      console.log("Creating order with payload:", orderPayload);

      // Use RPC function call to bypass RLS for admin operations
      const { data: createdOrderData, error: orderError } = await supabase
        .rpc('admin_create_order', orderPayload);

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Created order:", createdOrderData);

      if (!createdOrderData) {
        throw new Error("Order was created but no data was returned");
      }

      // Fetch the newly created order
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', createdOrderData)
        .single();
        
      if (fetchError) {
        console.error("Error fetching created order:", fetchError);
        throw fetchError;
      }

      if (images.length > 0) {
        const imageInserts = images.map((url, index) => ({
          order_id: createdOrderData,
          url,
          is_primary: index === 0
        }));

        const { error: imagesError } = await supabase
          .from('order_images')
          .insert(imageInserts);

        if (imagesError) {
          console.error("Error saving image references:", imagesError);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но возникла проблема с сохранением изображений",
            variant: "destructive"
          });
        }
      }

      if (videos.length > 0 && createdOrderData) {
        console.log("Saving video references to database, order ID:", createdOrderData);
        const videoRecords = videos.map(url => ({
          order_id: createdOrderData,
          url
        }));
        
        const { error: videosError } = await supabase
          .from('order_videos')
          .insert(videoRecords);
          
        if (videosError) {
          console.error("Error saving video records:", videosError);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но возникла проблема с сохранением видео",
            variant: "destructive"
          });
        }
      }

      // Send notification to Telegram with explicit 'create' action
      try {
        console.log("Sending Telegram notification for new order creation");
        await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...orderData, images },
            action: 'create'
          }
        });
        console.log("Telegram notification sent for new order");
      } catch (notifyError) {
        console.error('Failed to send order notification:', notifyError);
      }

      setCreatedOrder(orderData);
      toast({
        title: "Заказ создан",
        description: "Заказ был успешно создан",
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании заказа",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const handleImageDelete = (urlToDelete: string) => {
    setImages(prev => prev.filter(url => url !== urlToDelete));
  };

  const handleOrderUpdate = (updatedOrder: any) => {
    setCreatedOrder(updatedOrder);
  };

  if (createdOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')}
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
                buyerOptId: "",
                brand: "",
                model: "",
                sellerId: "",
                deliveryMethod: 'self_pickup',
                place_number: "1",
                text_order: "",
                delivery_price: "",
              });
              setImages([]);
              setVideos([]);
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Информация о свободном заказе</CardTitle>
            <CardDescription>
              Заполните необходимые поля для создания нового заказа
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerOptId">OPT_ID получателя *</Label>
                  <Select
                    value={formData.buyerOptId}
                    onValueChange={(value: string) => handleInputChange("buyerOptId", value)}
                    required
                  >
                    <SelectTrigger id="buyerOptId" className="bg-white">
                      <SelectValue placeholder="Выберите OPT_ID покупателя" />
                    </SelectTrigger>
                    <SelectContent>
                      {buyerProfiles.length === 0 ? (
                        <SelectItem value="no_data">Нет данных</SelectItem>
                      ) : (
                        buyerProfiles.map((p) => (
                          <SelectItem key={p.opt_id} value={p.opt_id}>
                            {p.opt_id} {p.full_name ? `- ${p.full_name}` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerId">Продавец *</Label>
                  <Select
                    value={formData.sellerId}
                    onValueChange={(value: string) => handleInputChange("sellerId", value)}
                    required
                  >
                    <SelectTrigger id="sellerId" className="bg-white">
                      <SelectValue placeholder="Выберите продавца" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellerProfiles.length === 0 ? (
                        <SelectItem value="no_data">Нет данных</SelectItem>
                      ) : (
                        sellerProfiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name || "Без имени"} {p.opt_id ? `(OPT_ID: ${p.opt_id})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedSeller && (
                <>
                  <div className="space-y-2">
                    <Label>Имя продавца</Label>
                    <Input 
                      value={selectedSeller.full_name || 'Неизвестный продавец'} 
                      readOnly 
                      className="bg-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>OPT_ID продавца</Label>
                    <Input 
                      value={selectedSeller.opt_id || ''} 
                      readOnly 
                      className="bg-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Телеграм продавца</Label>
                    <Input 
                      value={selectedSeller.telegram || ''} 
                      readOnly 
                      className="bg-gray-100"
                    />
                  </div>
                </>
              )}

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
                onClick={() => navigate('/admin')}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать заказ'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
