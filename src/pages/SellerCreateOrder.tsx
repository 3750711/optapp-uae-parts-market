import React, { useState, useEffect, useMemo } from "react";
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
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import { Database } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoUpload } from "@/components/ui/video-upload";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useFormAutosave } from "@/hooks/useFormAutosave";
import OptimizedSelect from "@/components/ui/OptimizedSelect";
import OptimizedProductImage from "@/components/ui/OptimizedProductImage";
import { debounce } from "lodash";
import { AlertCircle, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { useRealTimeValidation } from "@/hooks/useRealTimeValidation";
import TouchOptimizedInput from "@/components/ui/TouchOptimizedInput";
import FormProgressIndicator from "@/components/ui/FormProgressIndicator";
import SmartFieldHints from "@/components/ui/SmartFieldHints";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

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
  const isMobile = useIsMobile();
  
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [profileSearchTerm, setProfileSearchTerm] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    buyerOptId: "",
    brand: "",
    model: "",
    optid_created: "",
    seller_opt_id: "",
    deliveryMethod: 'self_pickup' as DeliveryMethod,
    place_number: "1",
    text_order: "",
    delivery_price: "",
  });

  // Автосохранение формы
  const { loadSavedData, clearSavedData, hasUnsavedChanges } = useFormAutosave({
    key: `seller_order_${productId || 'new'}`,
    data: { formData, images, videos },
    delay: 30000,
    enabled: !createdOrder
  });

  // Защита от двойной отправки
  const { isSubmitting, guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 5000,
    onDuplicateSubmit: () => {
      toast({
        title: "Подождите",
        description: "Заказ уже создается, подождите завершения",
        variant: "destructive",
      });
    }
  });

  // Real-time валидация
  const validationRules = [
    {
      field: 'title' as const,
      validator: (value: string) => {
        if (!value?.trim()) return 'Наименование обязательно';
        if (value.length < 3) return 'Минимум 3 символа';
        return null;
      }
    },
    {
      field: 'price' as const,
      validator: (value: string) => {
        if (!value) return 'Укажите цену';
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) return 'Цена должна быть положительным числом';
        return null;
      }
    },
    {
      field: 'buyerOptId' as const,
      validator: (value: string) => {
        if (!value) return 'Выберите покупателя';
        return null;
      }
    }
  ];

  const { validationState, isFieldValid, getFieldError } = useRealTimeValidation(
    { getValues: () => formData, setError: () => {}, clearErrors: () => {}, watch: () => {} } as any,
    validationRules
  );

  // Swipe navigation for mobile
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: () => {
      if (currentStep < 3) setCurrentStep(prev => prev + 1);
    },
    onSwipeRight: () => {
      if (currentStep > 1) setCurrentStep(prev => prev - 1);
    }
  });

  // Загрузка сохраненных данных при монтировании
  useEffect(() => {
    const savedData = loadSavedData();
    if (savedData && savedData.formData) {
      setFormData(savedData.formData);
      if (savedData.images) setImages(savedData.images);
      if (savedData.videos) setVideos(savedData.videos);
      toast({
        title: "Восстановлены данные",
        description: "Форма восстановлена из автосохранения",
      });
    }
  }, [loadSavedData]);

  // Debounced search for profiles
  const debouncedSearchTerm = useMemo(
    () => debounce((term: string) => setProfileSearchTerm(term), 300),
    []
  );

  // Optimized profiles query with search and caching
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['buyer-profiles', profileSearchTerm],
    queryFn: async () => {
      console.log("Fetching profiles with optimized query...");
      
      let query = supabase
        .from("profiles")
        .select("id, opt_id, full_name")
        .eq("user_type", "buyer")
        .not("opt_id", "is", null);

      // Add search filter if search term exists
      if (profileSearchTerm) {
        query = query.or(`opt_id.ilike.%${profileSearchTerm}%,full_name.ilike.%${profileSearchTerm}%`);
      }

      const { data, error } = await query
        .order('opt_id')
        .limit(100); // Limit results for performance

      if (error) {
        console.error("Ошибка загрузки списка OPT_ID:", error);
        throw error;
      }
      
      console.log("Fetched profiles:", data?.length || 0);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    enabled: true,
  });

  // Transform profiles for OptimizedSelect
  const profileOptions = useMemo(() => 
    profiles.map(p => ({
      value: p.opt_id,
      label: `${p.opt_id}${p.full_name ? ` - ${p.full_name}` : ''}`,
      searchText: `${p.opt_id} ${p.full_name || ''}`
    })), 
    [profiles]
  );

  // Load product data when productId changes
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
            buyerOptId: "",
            brand: product.brand || "",
            model: product.model || "",
            optid_created: product.optid_created || "",
            seller_opt_id: product.seller?.opt_id || "",
            deliveryMethod: 'self_pickup',
            place_number: "1",
            text_order: "",
            delivery_price: "",
          });
        }
      }
    };

    fetchProductData();
  }, [productId]);

  // Вычисляем прогресс формы
  const formFields = useMemo(() => [
    { name: 'title', label: 'Наименование', required: true, filled: !!formData.title, hasError: !isFieldValid('title') },
    { name: 'price', label: 'Цена', required: true, filled: !!formData.price, hasError: !isFieldValid('price') },
    { name: 'buyerOptId', label: 'Покупатель', required: true, filled: !!formData.buyerOptId, hasError: !isFieldValid('buyerOptId') },
    { name: 'brand', label: 'Бренд', required: false, filled: !!formData.brand },
    { name: 'model', label: 'Модель', required: false, filled: !!formData.model },
    { name: 'delivery_price', label: 'Доставка', required: false, filled: !!formData.delivery_price },
  ], [formData, isFieldValid]);

  // Умные подсказки
  const getSmartHints = (fieldName: string, value: string) => {
    const hints = [];
    
    if (fieldName === 'title' && value.length > 0 && value.length < 10) {
      hints.push({
        type: 'tip' as const,
        text: 'Добавьте больше деталей в название для лучшего поиска'
      });
    }
    
    if (fieldName === 'price' && value) {
      const price = parseFloat(value);
      if (price > 1000) {
        hints.push({
          type: 'trend' as const,
          text: 'Высокая цена. Убедитесь, что она корректна'
        });
      }
    }
    
    return hints;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setTouchedFields(prev => new Set(prev).add(field));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await guardedSubmit(async () => {
      if (!user) {
        toast({
          title: "Ошибка",
          description: "Вы должны быть авторизованы для создания заказа",
          variant: "destructive",
        });
        return;
      }

      // Валидация формы
      const errors = [];
      if (!formData.title.trim()) errors.push('Наименование обязательно');
      if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Укажите корректную цену');
      if (!formData.buyerOptId) errors.push('Выберите покупателя');

      if (errors.length > 0) {
        toast({
          title: "Ошибки в форме",
          description: errors.join(', '),
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
            return;
          }
        }

        console.log("Preparing to create order");

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
        console.log("Delivery price to be saved:", deliveryPrice);
        
        const orderPayload = {
          order_number: nextOrderNumber,
          title: formData.title,
          price: parseFloat(formData.price),
          place_number: parseInt(formData.place_number),
          seller_id: user.id,
          order_seller_name: profile?.full_name || 'Unknown',
          seller_opt_id: profile?.opt_id || null,
          buyer_id: buyerData.id,
          brand: formData.brand,
          model: formData.model,
          status: 'seller_confirmed' as OrderStatus,
          order_created_type: 'free_order' as OrderCreatedType,
          telegram_url_order: buyerData.telegram || null,
          images: images,
          product_id: resolvedProductId || null,
          delivery_method: formData.deliveryMethod as DeliveryMethod,
          text_order: formData.text_order || null,
          delivery_price_confirm: deliveryPrice,
        };

        console.log("Order payload with delivery price:", orderPayload);

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
        console.log("Saved delivery price:", createdOrder?.delivery_price_confirm);

        if (!createdOrder) {
          throw new Error("Order was created but no data was returned");
        }
        
        if (productId) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ status: 'sold' })
            .eq('id', productId);

          if (updateError) {
            console.error("Error updating product status:", updateError);
            toast({
              title: "Предупреждение",
              description: "Заказ создан, но статус товара не обновился. Пожалуйста, сообщите администратору.",
              variant: "destructive",
            });
          } else {
            console.log("Product status updated to sold successfully");
            // Notification will be sent automatically by the database trigger
          }
        }

        if (images.length > 0) {
          const imageInserts = images.map((url, index) => ({
            order_id: createdOrder.id,
            url,
            is_primary: false
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

        if (videos.length > 0 && createdOrder?.id) {
          console.log("Saving video references to database, order ID:", createdOrder.id);
          const videoRecords = videos.map(url => ({
            order_id: createdOrder.id,
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
          } else {
            console.log("Video records saved successfully");
          }
        }

        // Send notification to Telegram with explicit 'create' action
        try {
          console.log("Sending Telegram notification for new order creation");
          await supabase.functions.invoke('send-telegram-notification', {
            body: { 
              order: { ...createdOrder, images },
              action: 'create'
            }
          });
          console.log("Telegram notification sent for new order");
        } catch (notifyError) {
          console.error('Failed to send order notification:', notifyError);
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
      } finally {
      }
    });
  };

  const handleImageUpload = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const handleImageDelete = (urlToDelete: string) => {
    setImages(prev => prev.filter(url => url !== urlToDelete))
  };

  const handleOrderUpdate = (updatedOrder: any) => {
    setCreatedOrder(updatedOrder);
  };

  // Мобильные степперы
  const MobileStepNavigation = () => {
    if (!isMobile) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="min-h-[44px] px-6"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          
          <div className="flex space-x-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step === currentStep ? 'bg-primary' : 
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
            disabled={currentStep === 3}
            className="min-h-[44px] px-6"
          >
            Далее
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  if (createdOrder) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => navigate('/seller/dashboard')}
              className="mr-4 min-h-[44px]"
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
                  optid_created: "",
                  seller_opt_id: "",
                  deliveryMethod: 'self_pickup',
                  place_number: "1",
                  text_order: "",
                  delivery_price: "",
                });
                setImages([]);
                clearSavedData();
              }}
              className="min-h-[44px]"
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
      <div className="container mx-auto px-4 py-8" ref={swipeRef}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'pb-24' : ''}`}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={isMobile ? "text-xl" : ""}>Информация о заказе</CardTitle>
                  <CardDescription>
                    Заполните необходимые поля для создания нового заказа
                  </CardDescription>
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center text-orange-600 text-sm">
                    <Save className="h-4 w-4 mr-1" />
                    Автосохранение активно
                  </div>
                )}
              </div>
              
              {isMobile && (
                <div className="mt-4">
                  <FormProgressIndicator fields={formFields} />
                </div>
              )}
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Шаг 1: Основная информация */}
                {(!isMobile || currentStep === 1) && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className={isMobile ? "text-base font-medium" : ""}>
                        Наименование *
                      </Label>
                      <TouchOptimizedInput 
                        id="title" 
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required 
                        placeholder="Введите наименование"
                        touched={touchedFields.has('title')}
                        error={getFieldError('title')}
                        success={touchedFields.has('title') && isFieldValid('title')}
                      />
                      <SmartFieldHints 
                        fieldName="title"
                        value={formData.title}
                        suggestions={getSmartHints('title', formData.title)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>Бренд</Label>
                        <TouchOptimizedInput 
                          id="brand" 
                          value={formData.brand}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          placeholder="Введите бренд"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>Модель</Label>
                        <TouchOptimizedInput 
                          id="model"
                          value={formData.model}
                          onChange={(e) => handleInputChange('model', e.target.value)}
                          placeholder="Введите модель"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Шаг 2: Цена и покупатель */}
                {(!isMobile || currentStep === 2) && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className={isMobile ? "text-base font-medium" : ""}>
                          Цена ($) *
                        </Label>
                        <TouchOptimizedInput 
                          id="price" 
                          type="number" 
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          required 
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          touched={touchedFields.has('price')}
                          error={getFieldError('price')}
                          success={touchedFields.has('price') && isFieldValid('price')}
                        />
                        <SmartFieldHints 
                          fieldName="price"
                          value={formData.price}
                          suggestions={getSmartHints('price', formData.price)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_price" className={isMobile ? "text-base font-medium" : ""}>
                          Стоимость доставки ($)
                        </Label>
                        <TouchOptimizedInput 
                          id="delivery_price"
                          type="number"
                          value={formData.delivery_price}
                          onChange={(e) => handleInputChange('delivery_price', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buyerOptId" className={isMobile ? "text-base font-medium" : ""}>
                        OPT_ID получателя *
                      </Label>
                      <OptimizedSelect
                        options={profileOptions}
                        value={formData.buyerOptId}
                        onValueChange={(value) => handleInputChange("buyerOptId", value)}
                        placeholder={profilesLoading ? "Загрузка..." : "Выберите OPT_ID"}
                        searchPlaceholder="Поиск по OPT_ID или имени..."
                        disabled={profilesLoading}
                        className={`w-full ${isMobile ? 'min-h-[44px]' : ''}`}
                      />
                      {profilesLoading && (
                        <p className="text-sm text-muted-foreground">Загрузка профилей...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Шаг 3: Дополнительная информация */}
                {(!isMobile || currentStep === 3) && (
                  <div className="space-y-6">
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
                        maxImages={25}
                      />
                      {images.length > 0 && (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                          {images.map((url, index) => (
                            <div key={index} className="aspect-square rounded-md overflow-hidden">
                              <OptimizedProductImage
                                src={url}
                                alt={`Изображение заказа ${index + 1}`}
                                className="w-full h-full"
                                sizes="(max-width: 768px) 33vw, 25vw"
                              />
                            </div>
                          ))}
                        </div>
                      )}
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
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-end space-x-4">
                {!isMobile && (
                  <>
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => navigate(-1)}
                      className="min-h-[44px]"
                    >
                      Отмена
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 min-h-[44px]"
                      disabled={!canSubmit}
                    >
                      {isSubmitting ? "Создание..." : "Создать заказ"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </form>
          </Card>
          
          {!isMobile && (
            <div className="mt-6">
              <FormProgressIndicator fields={formFields} />
            </div>
          )}
        </div>
      </div>
      
      <MobileStepNavigation />
    </Layout>
  );
};

export default SellerCreateOrder;
