import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useConditionalCarData } from '@/hooks/useConditionalCarData';
import { useDebounceValue } from '@/hooks/useDebounceValue';
import { OrderFormData } from '@/components/admin/order/types';

export interface AdminOrderFormLogicReturn {
  // Form data
  formData: OrderFormData;
  handleInputChange: (field: string, value: string) => void;
  
  // Images and videos
  images: string[];
  videos: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setVideos: React.Dispatch<React.SetStateAction<string[]>>;
  handleImageUpload: (urls: string[]) => void;
  setAllImages: (urls: string[]) => void;
  
  // Profiles
  buyerProfiles: any[];
  sellerProfiles: any[];
  selectedSeller: any;
  
  // Car data
  brands: any[];
  brandModels: any[];
  isLoadingCarData: boolean;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: any[];
  filteredModels: any[];
  
  // Order creation
  isLoading: boolean;
  createdOrder: any;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleOrderUpdate: (order: any) => void;
  resetForm: () => void;
  
  // Navigation and utils
  navigate: ReturnType<typeof useNavigate>;
  parseTitleForBrand: (title: string) => { brand: string; model: string };
  
  // Creation progress
  creationStage: string;
  creationProgress: number;
  
  // Initialization states
  isInitializing: boolean;
  initializationError: string | null;
  hasAdminAccess: boolean;
}

export const useAdminOrderFormLogic = (): AdminOrderFormLogicReturn => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  // Initialization states
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initTimeout, setInitTimeout] = useState(false);

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
    deliveryMethod: 'self_pickup' as const,
    place_number: '',
    text_order: '',
    delivery_price: ''
  });

  // Media states
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  // Profile states
  const [buyerProfiles, setBuyerProfiles] = useState<any[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<any[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);

  // Car data with conditional loading
  const {
    brands,
    brandModels,
    isLoading: isLoadingCarData,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm
  } = useConditionalCarData();

  // Debounced search terms
  const debouncedBrandSearch = useDebounceValue(brandSearchTerm, 300);
  const debouncedModelSearch = useDebounceValue(modelSearchTerm, 300);

  // Filtered data
  const filteredBrands = useMemo(() => {
    if (!debouncedBrandSearch) return brands;
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(debouncedBrandSearch.toLowerCase())
    );
  }, [brands, debouncedBrandSearch]);

  const filteredModels = useMemo(() => {
    if (!debouncedModelSearch) return brandModels;
    return brandModels.filter(model => 
      model.name.toLowerCase().includes(debouncedModelSearch.toLowerCase())
    );
  }, [brandModels, debouncedModelSearch]);

  // Order creation states
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [creationStage, setCreationStage] = useState('');
  const [creationProgress, setCreationProgress] = useState(0);

  // Initialize component with timeout protection
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        setInitializationError(null);
        
        console.log('🚀 Starting admin order form initialization...', { isAdmin, user: !!user });
        
        // Set timeout for initialization
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Initialization timeout reached');
          setInitTimeout(true);
          setInitializationError('Тайм-аут инициализации. Проверьте подключение.');
          setIsInitializing(false);
        }, 10000); // 10 second timeout

        // Wait for admin check to complete (but not indefinitely)
        let retries = 0;
        while (isAdmin === null && retries < 50) { // Max 5 seconds (50 * 100ms)
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        clearTimeout(timeoutId);
        
        if (initTimeout) return; // Don't proceed if timeout occurred
        
        console.log('✅ Admin check completed:', { isAdmin, retries });
        
        if (isAdmin === false) {
          setInitializationError('У вас нет прав для доступа к этой странице');
          return;
        }

        if (isAdmin === true) {
          // Load initial data in parallel
          console.log('📊 Loading initial data...');
          await Promise.all([
            loadBuyerProfiles(),
            loadSellerProfiles()
          ]);
          console.log('✅ Initial data loaded successfully');
        }

        setInitializationError(null);
      } catch (error) {
        console.error('❌ Initialization error:', error);
        setInitializationError('Ошибка инициализации компонента');
      } finally {
        if (!initTimeout) {
          setIsInitializing(false);
        }
      }
    };

    initialize();
  }, [isAdmin, user, initTimeout]);

  const loadBuyerProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .limit(20);

      if (error) throw error;
      setBuyerProfiles(data || []);
    } catch (error) {
      console.error('Error loading buyer profiles:', error);
    }
  }, []);

  const loadSellerProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'seller')
        .limit(20);

      if (error) throw error;
      setSellerProfiles(data || []);
    } catch (error) {
      console.error('Error loading seller profiles:', error);
    }
  }, []);

  // Enhanced handleInputChange with proper typing and validation
  const handleInputChange = useCallback((field: string, value: string) => {
    console.log(`📝 Form field updated: ${field} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Enhanced handleImageUpload that combines new and existing images
  const handleImageUpload = useCallback((urls: string[]) => {
    console.log('📸 Adding new images to order:', urls);
    setImages(prev => {
      const combined = [...prev, ...urls];
      console.log('📸 Combined images:', { before: prev.length, after: combined.length });
      return combined;
    });
  }, []);

  // New function to replace images completely (for integration with optimized uploader)
  const setAllImages = useCallback((urls: string[]) => {
    console.log('🔄 Setting all order images:', urls);
    setImages(urls);
  }, []);

  // Enhanced handleSubmit with better error handling and logging
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setCreationStage('validating');
      setCreationProgress(10);

      console.log('📋 Starting order creation with data:', {
        title: formData.title,
        price: formData.price,
        buyerOptId: formData.buyerOptId,
        sellerId: formData.sellerId,
        imageCount: images.length,
        videoCount: videos.length
      });

      // Enhanced validation
      if (!formData.title?.trim()) {
        throw new Error('Название заказа обязательно');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Цена должна быть больше 0');
      }
      if (!formData.buyerOptId?.trim()) {
        throw new Error('ID покупателя обязателен');
      }

      setCreationStage('creating_order');
      setCreationProgress(50);

      // Create order logic with enhanced data
      const orderData = {
        title: formData.title.trim(),
        price: parseFloat(formData.price),
        buyer_opt_id: formData.buyerOptId.trim(),
        brand: formData.brand?.trim() || '',
        model: formData.model?.trim() || '',
        seller_id: formData.sellerId || user?.id,
        delivery_method: formData.deliveryMethod,
        place_number: parseInt(formData.place_number) || 1,
        text_order: formData.text_order?.trim() || '',
        delivery_price: parseFloat(formData.delivery_price) || 0,
        images,
        video_url: videos,
        created_by: user?.id,
        // Enhanced metadata
        order_created_type: 'free' as const,
        status: 'pending' as const
      };

      console.log('💾 Inserting order into database:', orderData);

      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      setCreationStage('completed');
      setCreationProgress(100);
      setCreatedOrder(order);

      console.log('✅ Order created successfully:', order);

      toast({
        title: "Заказ создан",
        description: `Заказ #${order.order_number || order.id} успешно создан в системе`,
      });

    } catch (error) {
      console.error('💥 Order creation error:', error);
      toast({
        title: "Ошибка создания заказа",
        description: error instanceof Error ? error.message : "Произошла неожиданная ошибка",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, images, videos, user?.id, toast]);

  const handleOrderUpdate = useCallback((order: any) => {
    setCreatedOrder(order);
  }, []);

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
      deliveryMethod: 'self_pickup' as const,
      place_number: '',
      text_order: '',
      delivery_price: ''
    });
    setImages([]);
    setVideos([]);
    setCreatedOrder(null);
    setCreationStage('');
    setCreationProgress(0);
  }, []);

  return {
    // Form data
    formData,
    handleInputChange,
    
    // Images and videos
    images,
    videos,
    setImages,
    setVideos,
    handleImageUpload,
    setAllImages,
    
    // Profiles
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    
    // Car data
    brands,
    brandModels,
    isLoadingCarData,
    searchBrandTerm: brandSearchTerm,
    setSearchBrandTerm: setBrandSearchTerm,
    searchModelTerm: modelSearchTerm,
    setSearchModelTerm: setModelSearchTerm,
    filteredBrands,
    filteredModels,
    
    // Order creation
    isLoading,
    createdOrder,
    handleSubmit,
    handleOrderUpdate,
    resetForm,
    
    // Navigation and utils
    navigate,
    parseTitleForBrand,
    
    // Creation progress
    creationStage,
    creationProgress,
    
    // Initialization states with enhanced error handling
    isInitializing,
    initializationError,
    hasAdminAccess: isAdmin === true
  };
};
