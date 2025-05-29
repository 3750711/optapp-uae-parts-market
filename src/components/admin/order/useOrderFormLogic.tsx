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
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData 
  } = useCarBrandsAndModels();

  // Filter brands and models based on search terms
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  const filteredModels = brandModels.filter(model => 
    model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
  );
  
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
        
        // Load models for this brand
        selectBrand(brand.id);
        break;
      }
    }
  }, [brands, selectBrand]);

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
      selectBrand(formData.brandId);
      
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
        const modelBelongsToBrand = brandModels.some(model => 
          model.id === formData.modelId && model.brand_id === formData.brandId
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
  }, [formData.brandId, brands, brandModels, selectBrand]);
  
  // Update model name when modelId changes
  useEffect(() => {
    if (formData.modelId) {
      const selectedModel = brandModels.find(model => model.id === formData.modelId);
      if (selectedModel) {
        setFormData(prev => ({
          ...prev,
          model: selectedModel.name
        }));
      }
    }
  }, [formData.modelId, brandModels]);

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

  // Enhanced function to get seller name with robust validation and trimming
  const getSellerName = (): string => {
    console.log("=== Getting seller name debug ===");
    console.log("Selected seller:", selectedSeller);
    console.log("Form data sellerId:", formData.sellerId);
    
    // First try from selectedSeller
    if (selectedSeller?.full_name) {
      const trimmedName = selectedSeller.full_name.trim();
      console.log("Using selectedSeller full_name (original):", selectedSeller.full_name);
      console.log("Using selectedSeller full_name (trimmed):", trimmedName);
      if (trimmedName) {
        return trimmedName;
      }
    }

    // Then try to find in sellerProfiles by sellerId
    if (formData.sellerId) {
      const seller = sellerProfiles.find(s => s.id === formData.sellerId);
      if (seller?.full_name) {
        const trimmedName = seller.full_name.trim();
        console.log("Found seller in profiles (original):", seller.full_name);
        console.log("Found seller in profiles (trimmed):", trimmedName);
        if (trimmedName) {
          return trimmedName;
        }
      }
    }

    // Last resort - use a default
    console.warn("Could not determine seller name, using default");
    return 'Неизвестный продавец';
  };

  const validateFormData = (): boolean => {
    const errors = [];

    console.log("=== Validating form data ===");
    console.log("Form data:", formData);

    if (!formData.title.trim()) {
      errors.push('Наименование обязательно для заполнения');
    }

    // Updated price validation to allow 0 and negative prices
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      errors.push('Укажите корректную цену');
    }

    if (!formData.sellerId) {
      errors.push('Выберите продавца');
    }

    if (!formData.buyerOptId) {
      errors.push('Выберите покупателя');
    }

    // Check if seller name can be determined
    const sellerName = getSellerName();
    console.log("Validated seller name:", sellerName);
    if (!sellerName || sellerName === 'Неизвестный продавец') {
      errors.push('Не удалось определить имя продавца');
    }

    if (errors.length > 0) {
      console.error("Validation errors:", errors);
      toast({
        title: "Ошибки в форме",
        description: errors.join(', '),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCreationStage('validating');
    setCreationProgress(10);

    console.log("=== Starting order submission ===");
    console.log("Form data:", formData);
    console.log("Selected seller:", selectedSeller);

    // Enhanced validation
    if (!validateFormData()) {
      setIsLoading(false);
      setCreationStage('');
      setCreationProgress(0);
      return;
    }

    try {
      setCreationStage('fetching_buyer');
      setCreationProgress(20);
      
      console.log("=== Fetching buyer data ===");
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
      
      // Get seller name using the robust validation logic
      const orderSellerName = getSellerName();
      
      console.log("=== Final order data preparation ===");
      console.log("Final order seller name:", orderSellerName);
      console.log("Delivery price:", deliveryPrice);
      
      // Double-check that we have a valid seller name
      if (!orderSellerName || orderSellerName === 'Неизвестный продавец') {
        throw new Error('Не удалось определить имя продавца для создания заказа');
      }
      
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

      console.log("=== Creating order with RPC ===");
      console.log("Order payload:", orderPayload);

      // Use RPC function call to bypass RLS for admin operations
      const { data: createdOrderData, error: orderError } = await supabase
        .rpc('admin_create_order', orderPayload);

      if (orderError) {
        console.error("=== RPC Error Details ===");
        console.error("Error code:", orderError.code);
        console.error("Error message:", orderError.message);
        console.error("Error details:", orderError.details);
        console.error("Error hint:", orderError.hint);
        throw orderError;
      }

      console.log("=== Order created successfully ===");
      console.log("Created order ID:", createdOrderData);

      if (!createdOrderData) {
        throw new Error("Order was created but no data was returned");
      }

      setCreationStage('fetching_order');
      setCreationProgress(60);

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

      console.log("=== Order fetched successfully ===");
      console.log("Order data:", orderData);

      setCreationStage('saving_videos');
      setCreationProgress(75);

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
      console.error("=== Order creation error ===");
      console.error("Error type:", typeof error);
      console.error("Error object:", error);
      
      let errorMessage = "Произошла ошибка при создании заказа";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // Additional error details for PostgreSQL errors
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
    brandModels,
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
