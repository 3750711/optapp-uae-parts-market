import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { OrderFormData, ProfileShort, SellerProfile, OrderStatus, OrderCreatedType, DeliveryMethod } from "./types";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";

export const useOrderFormLogic = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [buyerProfiles, setBuyerProfiles] = useState<ProfileShort[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  
  // New states for tracking order creation stages
  const [creationStage, setCreationStage] = useState<string>('');
  const [creationProgress, setCreationProgress] = useState<number>(0);

  // Car brands and models state
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  
  const { 
    brands, 
    allModels,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData 
  } = useCarBrandsAndModels();

  // Filter models based on selected brand and search term
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  // Get models for currently selected brand in form
  const getModelsForBrand = useCallback((brandId: string) => {
    if (!brandId || !allModels) return [];
    return allModels.filter(model => model.brand_id === brandId);
  }, [allModels]);

  const filteredModels = useCallback((brandId: string) => {
    const brandModels = getModelsForBrand(brandId);
    if (!searchModelTerm) return brandModels;
    return brandModels.filter(model => 
      model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
    );
  }, [getModelsForBrand, searchModelTerm]);
  
  const [formData, setFormData] = useState<OrderFormData>({
    title: "",
    price: "",
    buyerOptId: "",
    brand: "",
    model: "",
    brandId: "",
    modelId: "",
    sellerId: "",
    deliveryMethod: 'cargo_rf' as DeliveryMethod,
    place_number: "1",
    text_order: "",
    delivery_price: "",
  });

  // New function to parse title for brand information
  const parseTitleForBrand = useCallback((title: string) => {
    if (!title || brands.length === 0) return;
    
    // Convert title to lowercase for case-insensitive matching
    const titleLower = title.toLowerCase();
    
    // Try to find a brand match in the title
    for (const brand of brands) {
      if (titleLower.includes(brand.name.toLowerCase())) {
        // If brand is found in the title, set it
        setFormData(prev => ({
          ...prev,
          brandId: brand.id,
          brand: brand.name
        }));
        break;
      }
    }
  }, [brands]);

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

  // Handle brand and model changes
  useEffect(() => {
    if (formData.brandId) {
      // Set the brand name when brandId changes
      const selectedBrand = brands.find(brand => brand.id === formData.brandId);
      if (selectedBrand) {
        setFormData(prev => ({
          ...prev,
          brand: selectedBrand.name
        }));
      }
      
      // Reset model if the brand has changed
      if (formData.modelId) {
        const currentBrandModels = getModelsForBrand(formData.brandId);
        const modelBelongsToBrand = currentBrandModels.some(model => 
          model.id === formData.modelId
        );
        
        if (!modelBelongsToBrand) {
          setFormData(prev => ({
            ...prev,
            modelId: '',
            model: ''
          }));
        }
      }
    }
  }, [formData.brandId, brands, getModelsForBrand, formData.modelId]);
  
  // Update model name when modelId changes
  useEffect(() => {
    if (formData.modelId) {
      const selectedModel = allModels.find(model => model.id === formData.modelId);
      if (selectedModel) {
        setFormData(prev => ({
          ...prev,
          model: selectedModel.name
        }));
      }
    }
  }, [formData.modelId, allModels]);

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
      brandId: "",
      modelId: "",
      sellerId: "",
      deliveryMethod: 'cargo_rf',
      place_number: "1",
      text_order: "",
      delivery_price: "",
    });
    setImages([]);
    setVideos([]);
    setCreationStage('');
    setCreationProgress(0);
  };

  // Строгая валидация имени продавца
  const validateAndGetSellerName = (): string => {
    console.log("=== Строгая валидация имени продавца ===");
    console.log("selectedSeller:", selectedSeller);
    console.log("formData.sellerId:", formData.sellerId);
    
    let validatedName = '';
    
    // Шаг 1: Проверяем selectedSeller
    if (selectedSeller?.full_name) {
      const trimmedName = selectedSeller.full_name.trim();
      console.log("Имя из selectedSeller (до trim):", selectedSeller.full_name);
      console.log("Имя из selectedSeller (после trim):", trimmedName);
      
      if (trimmedName && trimmedName !== '') {
        validatedName = trimmedName;
        console.log("✅ Используем имя из selectedSeller:", validatedName);
      }
    }
    
    // Шаг 2: Если не нашли в selectedSeller, ищем в sellerProfiles
    if (!validatedName && formData.sellerId) {
      const seller = sellerProfiles.find(s => s.id === formData.sellerId);
      if (seller?.full_name) {
        const trimmedName = seller.full_name.trim();
        console.log("Имя из sellerProfiles (до trim):", seller.full_name);
        console.log("Имя из sellerProfiles (после trim):", trimmedName);
        
        if (trimmedName && trimmedName !== '') {
          validatedName = trimmedName;
          console.log("✅ Используем имя из sellerProfiles:", validatedName);
        }
      }
    }
    
    // Шаг 3: Последняя проверка и fallback
    if (!validatedName || validatedName === '') {
      console.warn("⚠️ Не удалось найти валидное имя продавца");
      validatedName = 'Unknown Seller';
    }
    
    console.log("=== Финальное валидированное имя:", `"${validatedName}"`);
    
    // Дополнительная проверка на NULL/undefined
    if (validatedName === null || validatedName === undefined) {
      console.error("🚨 КРИТИЧЕСКАЯ ОШИБКА: validatedName is null/undefined!");
      validatedName = 'Unknown Seller';
    }
    
    return validatedName;
  };

  const validateFormData = (): boolean => {
    const errors = [];

    console.log("=== Валидация данных формы ===");
    console.log("Form data:", formData);

    if (!formData.title.trim()) {
      errors.push('Наименование обязательно для заполнения');
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      errors.push('Укажите корректную цену');
    }

    if (!formData.sellerId) {
      errors.push('Выберите продавца');
    }

    if (!formData.buyerOptId) {
      errors.push('Выберите покупателя');
    }

    // Строгая проверка имени продавца
    const sellerName = validateAndGetSellerName();
    if (!sellerName || sellerName === 'Unknown Seller') {
      errors.push('Не удалось определить корректное имя продавца');
    }

    if (errors.length > 0) {
      console.error("❌ Ошибки валидации:", errors);
      toast({
        title: "Ошибки в форме",
        description: errors.join(', '),
        variant: "destructive",
      });
      return false;
    }

    console.log("✅ Валидация пройдена успешно");
    return true;
  };

  // Улучшенная функция для прямого создания заказа
  const createOrderDirect = async (orderSellerName: string, buyerData: any, deliveryPrice: number | null) => {
    console.log("=== Прямое создание заказа ===");
    console.log("orderSellerName:", `"${orderSellerName}"`);
    
    // Дополнительная валидация перед созданием
    if (!orderSellerName || orderSellerName.trim() === '') {
      throw new Error("orderSellerName не может быть пустым");
    }
    
    const finalSellerName = orderSellerName.trim();
    console.log("finalSellerName после trim:", `"${finalSellerName}"`);
    
    // Get next order number
    const { data: existingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1);

    if (ordersError) {
      console.error("Error getting order numbers:", ordersError);
      throw new Error("Failed to get next order number");
    }

    const nextOrderNumber = existingOrders && existingOrders.length > 0 
      ? existingOrders[0].order_number + 1 
      : 1;

    console.log("Next order number (fallback):", nextOrderNumber);

    const orderPayload = {
      order_number: nextOrderNumber,
      title: formData.title,
      price: parseFloat(formData.price),
      place_number: parseInt(formData.place_number),
      seller_id: formData.sellerId,
      order_seller_name: finalSellerName, // Используем строго валидированное имя
      seller_opt_id: selectedSeller?.opt_id || null,
      buyer_id: buyerData.id,
      brand: formData.brand || '',
      model: formData.model || '',
      status: 'seller_confirmed' as OrderStatus,
      order_created_type: 'free_order' as OrderCreatedType,
      telegram_url_order: selectedSeller?.telegram || null,
      images: images,
      product_id: null,
      delivery_method: formData.deliveryMethod as DeliveryMethod,
      text_order: formData.text_order || null,
      delivery_price_confirm: deliveryPrice,
    };

    console.log("=== Payload для прямого создания ===");
    console.log("Order payload:", orderPayload);
    console.log("order_seller_name в payload:", `"${orderPayload.order_seller_name}"`);

    const { data: createdOrderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      console.error("=== Ошибка прямого создания ===");
      console.error("Error details:", orderError);
      throw orderError;
    }

    console.log("=== Заказ создан успешно (прямое создание) ===");
    console.log("Created order:", createdOrderData);
    
    return createdOrderData.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCreationStage('validating');
    setCreationProgress(10);

    console.log("=== Начало создания заказа ===");
    console.log("Form data:", formData);
    console.log("Selected seller:", selectedSeller);

    // Строгая валидация
    if (!validateFormData()) {
      setIsLoading(false);
      setCreationStage('');
      setCreationProgress(0);
      return;
    }

    try {
      setCreationStage('fetching_buyer');
      setCreationProgress(20);
      
      console.log("=== Получение данных покупателя ===");
      console.log("Buyer OPT ID:", formData.buyerOptId);

      const { data: buyerData, error: buyerError } = await supabase
        .from('profiles')
        .select('id, full_name, telegram')
        .eq('opt_id', formData.buyerOptId)
        .maybeSingle();

      if (buyerError) {
        console.error("Buyer fetch error:", buyerError);
        throw buyerError;
      }

      console.log("Buyer data found:", buyerData);

      if (!buyerData?.id) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти получателя с указанным OPT ID",
          variant: "destructive",
        });
        setIsLoading(false);
        setCreationStage('');
        setCreationProgress(0);
        return;
      }

      setCreationStage('creating_order');
      setCreationProgress(40);
      
      const deliveryPrice = formData.delivery_price ? parseFloat(formData.delivery_price) : null;
      
      // Получаем строго валидированное имя продавца
      const orderSellerName = validateAndGetSellerName();
      
      console.log("=== Финальная подготовка заказа ===");
      console.log("Final order seller name:", `"${orderSellerName}"`);
      console.log("Delivery price:", deliveryPrice);
      
      // Критическая проверка перед созданием
      if (!orderSellerName || orderSellerName === 'Unknown Seller' || orderSellerName.trim() === '') {
        throw new Error('Критическая ошибка: не удалось получить валидное имя продавца');
      }
      
      let createdOrderId: string;

      try {
        // Сначала пробуем RPC функцию
        const orderPayload = {
          p_title: formData.title,
          p_price: parseFloat(formData.price),
          p_place_number: parseInt(formData.place_number),
          p_seller_id: formData.sellerId,
          p_order_seller_name: orderSellerName,
          p_seller_opt_id: selectedSeller?.opt_id || null,
          p_buyer_id: buyerData.id,
          p_brand: formData.brand || '',
          p_model: formData.model || '',
          p_status: 'seller_confirmed' as OrderStatus,
          p_order_created_type: 'free_order' as OrderCreatedType,
          p_telegram_url_order: selectedSeller?.telegram || null,
          p_images: images,
          p_product_id: null,
          p_delivery_method: formData.deliveryMethod as DeliveryMethod,
          p_text_order: formData.text_order || null,
          p_delivery_price_confirm: deliveryPrice,
        };

        console.log("=== Создание заказа через RPC ===");
        console.log("RPC payload:", orderPayload);
        console.log("p_order_seller_name в RPC:", `"${orderPayload.p_order_seller_name}"`);

        // Использование RPC функции для обхода RLS
        const { data: rpcOrderId, error: orderError } = await supabase
          .rpc('admin_create_order', orderPayload);

        if (orderError) {
          console.error("=== Ошибка RPC ===");
          console.error("RPC Error details:", orderError);
          
          // Переход на fallback метод
          console.log("=== Переход на fallback метод ===");
          createdOrderId = await createOrderDirect(orderSellerName, buyerData, deliveryPrice);
        } else {
          console.log("=== RPC успешно ===");
          console.log("Created order ID via RPC:", rpcOrderId);
          createdOrderId = rpcOrderId;
        }
      } catch (rpcError) {
        console.error("=== RPC Exception ===");
        console.error("RPC error:", rpcError);
        createdOrderId = await createOrderDirect(orderSellerName, buyerData, deliveryPrice);
      }

      if (!createdOrderId) {
        throw new Error("Order creation failed: no ID returned");
      }

      setCreationStage('fetching_order');
      setCreationProgress(60);

      // Получение созданного заказа
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', createdOrderId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching created order:", fetchError);
        throw fetchError;
      }

      console.log("=== Заказ получен успешно ===");
      console.log("Order data:", orderData);

      setCreationStage('saving_videos');
      setCreationProgress(75);

      if (videos.length > 0 && createdOrderId) {
        console.log("Saving video references to database, order ID:", createdOrderId);
        const videoRecords = videos.map(url => ({
          order_id: createdOrderId,
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

      // Отправляем уведомление о проданном товаре, если заказ связан с товаром
      if (orderData.product_id) {
        try {
          console.log("Отправка уведомления о проданном товаре через новую функцию");
          setTimeout(async () => {
            try {
              await supabase.functions.invoke('send-product-sold-notification', {
                body: { productId: orderData.product_id }
              });
              console.log("Уведомление о продаже товара отправлено успешно");
            } catch (notifyError) {
              console.error('Ошибка при отправке уведомления о продаже товара:', notifyError);
            }
          }, 100);
        } catch (error) {
          console.error('Ошибка при настройке отправки уведомления о продаже товара:', error);
        }
      }

      setCreatedOrder(orderData);
      setCreationStage('completed');
      setCreationProgress(100);
      
      toast({
        title: "Заказ создан",
        description: "Заказ был успешно создан",
      });
      
      // Отправляем уведомление в Telegram асинхронно
      sendTelegramNotification(orderData, images);
      
    } catch (error) {
      console.error("=== Критическая ошибка создания заказа ===");
      console.error("Error type:", typeof error);
      console.error("Error object:", error);
      
      let errorMessage = "Произошла ошибка при создании заказа";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // Дополнительная информация об ошибках PostgreSQL
      if (error && typeof error === 'object' && 'code' in error) {
        console.error("PostgreSQL error code:", (error as any).code);
        console.error("PostgreSQL error details:", (error as any).details);
        console.error("PostgreSQL error hint:", (error as any).hint);
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // New function to send notifications asynchronously
  const sendTelegramNotification = async (orderData: any, orderImages: string[]) => {
    try {
      console.log("Sending Telegram notification for new order creation (async)");
      
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: { 
              order: { ...orderData, images: orderImages },
              action: 'create'
            }
          });
          console.log("Telegram notification sent for new order");
        } catch (notifyError) {
          console.error('Failed to send order notification:', notifyError);
        }
      }, 100);
    } catch (error) {
      console.error('Error setting up async notification:', error);
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
    brands,
    allModels,
    getModelsForBrand,
    isLoadingCarData,
    searchBrandTerm,
    setSearchBrandTerm,
    searchModelTerm,
    setSearchModelTerm,
    filteredBrands,
    filteredModels,
    setImages,
    setVideos,
    handleInputChange,
    handleImageUpload,
    handleOrderUpdate,
    handleSubmit,
    resetForm,
    navigate,
    parseTitleForBrand,
    creationStage,
    creationProgress
  };
};

export default useOrderFormLogic;
