
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useConditionalCarData } from '@/hooks/useConditionalCarData';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';

interface Profile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
  user_type: string;
}

interface OrderFormData {
  title: string;
  price: string;
  buyerOptId: string;
  brand: string;
  model: string;
  brandId: string;
  modelId: string;
  sellerId: string;
  deliveryMethod: string;
  place_number: string;
  text_order: string;
  delivery_price: string;
}

export const useAdminOrderFormLogic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  // Form data state
  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    price: '',
    buyerOptId: '',
    brand: '',
    model: '',
    brandId: '',
    modelId: '',
    sellerId: '',
    deliveryMethod: 'self_pickup',
    place_number: '1',
    text_order: '',
    delivery_price: '0',
  });

  // Media state
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Progress tracking
  const [creationStage, setCreationStage] = useState<string>('idle');
  const [creationProgress, setCreationProgress] = useState(0);

  // Initialization states
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Profiles
  const [buyerProfiles, setBuyerProfiles] = useState<Profile[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<Profile[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Profile | null>(null);

  // Car data
  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoadingBrands,
    isLoadingModels,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
  } = useConditionalCarData();

  // Filtered data for compatibility
  const filteredBrands = brands;
  const filteredModels = brandModels;
  const isLoadingCarData = isLoadingBrands || isLoadingModels;
  const searchBrandTerm = brandSearchTerm;
  const setSearchBrandTerm = setBrandSearchTerm;
  const searchModelTerm = modelSearchTerm;
  const setSearchModelTerm = setModelSearchTerm;

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!isAdmin) {
          setInitializationError('У вас нет прав для доступа к этой странице');
          return;
        }

        // Load initial data
        await Promise.all([
          loadBuyerProfiles(),
          loadSellerProfiles()
        ]);

        setIsInitializing(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setInitializationError('Ошибка инициализации формы');
      }
    };

    initialize();
  }, [isAdmin]);

  const loadBuyerProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram, user_type')
        .eq('user_type', 'buyer')
        .limit(20);

      if (error) throw error;
      setBuyerProfiles(data || []);
    } catch (error) {
      console.error('Error loading buyer profiles:', error);
    }
  };

  const loadSellerProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram, user_type')
        .eq('user_type', 'seller')
        .limit(20);

      if (error) throw error;
      setSellerProfiles(data || []);
    } catch (error) {
      console.error('Error loading seller profiles:', error);
    }
  };

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleImageUpload = useCallback((urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  }, []);

  const parseTitleForBrand = useCallback((title: string) => {
    // Simple brand parsing logic
    const lowerTitle = title.toLowerCase();
    const foundBrand = brands.find(brand => 
      lowerTitle.includes(brand.name.toLowerCase())
    );
    
    if (foundBrand) {
      handleInputChange('brand', foundBrand.name);
      handleInputChange('brandId', foundBrand.id);
      selectBrand(foundBrand.id);
    }
  }, [brands, handleInputChange, selectBrand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price || !formData.buyerOptId) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCreationStage('validating');
    setCreationProgress(10);

    try {
      // Find buyer by OPT ID
      setCreationStage('fetching_buyer');
      setCreationProgress(20);

      const { data: buyerData, error: buyerError } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('opt_id', formData.buyerOptId)
        .eq('user_type', 'buyer')
        .single();

      if (buyerError || !buyerData) {
        throw new Error('Покупатель с указанным OPT_ID не найден');
      }

      // Create order
      setCreationStage('creating_order');
      setCreationProgress(50);

      const orderData = {
        title: formData.title,
        price: parseFloat(formData.price),
        brand: formData.brand,
        model: formData.model,
        buyer_id: buyerData.id,
        seller_id: formData.sellerId || user?.id,
        buyer_opt_id: formData.buyerOptId,
        text_order: formData.text_order,
        delivery_price: parseFloat(formData.delivery_price) || 0,
        place_number: parseInt(formData.place_number) || 1,
        status: 'created',
        order_created_type: 'free_order',
        delivery_method: formData.deliveryMethod,
        images: images,
        video_url: videos,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      setCreationStage('completed');
      setCreationProgress(100);
      setCreatedOrder(order);

      toast({
        title: "Успех",
        description: "Заказ успешно создан",
      });

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать заказ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      price: '',
      buyerOptId: '',
      brand: '',
      model: '',
      brandId: '',
      modelId: '',
      sellerId: '',
      deliveryMethod: 'self_pickup',
      place_number: '1',
      text_order: '',
      delivery_price: '0',
    });
    setImages([]);
    setVideos([]);
    setCreatedOrder(null);
    setCreationStage('idle');
    setCreationProgress(0);
  }, []);

  const handleOrderUpdate = useCallback((updatedOrder: any) => {
    setCreatedOrder(updatedOrder);
  }, []);

  return {
    // Form data
    formData,
    images,
    videos,
    
    // Profiles
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    
    // Loading states
    isLoading,
    createdOrder,
    isInitializing,
    initializationError,
    hasAdminAccess: isAdmin,
    
    // Car data
    brands,
    brandModels,
    isLoadingCarData,
    searchBrandTerm,
    setSearchBrandTerm,
    searchModelTerm,
    setSearchModelTerm,
    filteredBrands,
    filteredModels,
    
    // Media handlers
    setImages,
    setVideos,
    handleImageUpload,
    
    // Form handlers
    handleInputChange,
    handleSubmit,
    resetForm,
    handleOrderUpdate,
    parseTitleForBrand,
    
    // Navigation
    navigate,
    
    // Progress
    creationStage,
    creationProgress,
  };
};
