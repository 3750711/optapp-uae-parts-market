
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { OrderFormData, ProfileShort, SellerProfile, OrderStatus, OrderCreatedType, DeliveryMethod } from "./types";

export const useOrderFormLogic = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [buyerProfiles, setBuyerProfiles] = useState<ProfileShort[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  
  const [formData, setFormData] = useState<OrderFormData>({
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

  const handleImageUpload = (urls: string[]) => {
    setImages(urls);
  };

  const handleOrderUpdate = (updatedOrder: any) => {
    setCreatedOrder(updatedOrder);
  };

  const resetForm = () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

      if (videos.length > 0 && createdOrderData) {
        console.log("Saving video references to database, order ID:", createdOrderData);
        // Для видео по-прежнему используем прямую вставку
        // Но в будущем можно модифицировать RPC функцию для видео
        const videoRecords = videos.map(url => ({
          order_id: createdOrderData,
          url
        }));
        
        // Прямая вставка может работать если у админа есть права,
        // в противном случае будет ошибка RLS
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

  return {
    formData,
    images,
    videos,
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    isLoading,
    createdOrder,
    setImages,
    setVideos,
    handleInputChange,
    handleImageUpload,
    handleOrderUpdate,
    handleSubmit,
    resetForm,
    navigate
  };
};
