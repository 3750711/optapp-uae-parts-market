
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  
  // Enhanced initialization states
  isInitializing: boolean;
  initializationError: string | null;
  hasAdminAccess: boolean;
  initializationStage: string;
  initializationProgress: number;
  forceComplete: () => void;
}

export const useAdminOrderFormLogic = (): AdminOrderFormLogicReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  // Enhanced initialization states
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initializationStage, setInitializationStage] = useState('starting');
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [forceCompleted, setForceCompleted] = useState(false);

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

  // Parse title for brand and model
  const parseTitleForBrand = useCallback((title: string) => {
    if (!title || brands.length === 0) {
      return { brand: '', model: '' };
    }

    const lowerTitle = title.toLowerCase();
    const sortedBrands = [...brands].sort((a, b) => b.name.length - a.name.length);

    for (const brand of sortedBrands) {
      const brandNameLower = brand.name.toLowerCase();
      if (lowerTitle.includes(brandNameLower)) {
        const relevantModels = brandModels.filter(model => model.brand_id === brand.id);
        const sortedModels = [...relevantModels].sort((a, b) => b.name.length - a.name.length);
        
        for (const model of sortedModels) {
          const modelNameLower = model.name.toLowerCase();
          if (lowerTitle.includes(modelNameLower)) {
            return { brand: brand.name, model: model.name };
          }
        }
        return { brand: brand.name, model: '' };
      }
    }
    return { brand: '', model: '' };
  }, [brands, brandModels]);

  // Force complete initialization
  const forceComplete = useCallback(() => {
    console.log('🔧 Force completing initialization...');
    setForceCompleted(true);
    setIsInitializing(false);
    setInitializationStage('force_completed');
    setInitializationProgress(100);
    setInitializationError(null);
  }, []);

  // Enhanced initialization with better route checking and timeouts
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🚀 Starting enhanced admin order form initialization...', { 
          isAdmin, 
          user: !!user, 
          route: location.pathname,
          forceCompleted
        });
        
        if (forceCompleted) {
          console.log('⚡ Initialization already force completed');
          return;
        }
        
        setIsInitializing(true);
        setInitializationError(null);
        setInitializationStage('route_check');
        setInitializationProgress(10);
        
        // Route validation
        const validRoutes = ['/admin/free-order', '/admin/orders/create'];
        if (!validRoutes.includes(location.pathname)) {
          console.warn('⚠️ Invalid route for admin order form:', location.pathname);
          setInitializationError('Неверный маршрут для формы заказа');
          navigate('/admin/dashboard');
          return;
        }
        
        console.log('✅ Route validation passed');
        setInitializationStage('auth_check');
        setInitializationProgress(20);
        
        // Reduced timeout to 5 seconds
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Initialization timeout reached (5s)');
          setInitializationError('Тайм-аут инициализации. Попробуйте обновить страницу или принудительно завершить.');
          setInitializationStage('timeout');
        }, 5000);

        // Enhanced admin check with detailed logging
        let retries = 0;
        const maxRetries = 25; // Reduced from 50 (2.5 seconds max)
        
        setInitializationStage('admin_verification');
        while (isAdmin === null && retries < maxRetries && !forceCompleted) {
          console.log(`🔄 Admin check retry ${retries + 1}/${maxRetries}, isAdmin:`, isAdmin);
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
          setInitializationProgress(20 + (retries / maxRetries) * 30);
        }
        
        clearTimeout(timeoutId);
        
        if (forceCompleted) {
          console.log('⚡ Initialization was force completed during admin check');
          return;
        }
        
        console.log('✅ Admin check completed:', { isAdmin, retries, timeElapsed: retries * 100 });
        
        if (isAdmin === null) {
          setInitializationError('Не удалось проверить права администратора. Попробуйте обновить страницу.');
          setInitializationStage('admin_check_failed');
          return;
        }
        
        if (isAdmin === false) {
          setInitializationError('У вас нет прав администратора для доступа к этой странице');
          setInitializationStage('access_denied');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        setInitializationStage('loading_data');
        setInitializationProgress(60);

        if (isAdmin === true) {
          console.log('📊 Loading initial data...');
          try {
            await Promise.all([
              loadBuyerProfiles(),
              loadSellerProfiles()
            ]);
            console.log('✅ Initial data loaded successfully');
            setInitializationProgress(90);
          } catch (error) {
            console.error('❌ Error loading initial data:', error);
            setInitializationError('Ошибка загрузки данных');
            setInitializationStage('data_load_failed');
            return;
          }
        }

        setInitializationStage('completed');
        setInitializationProgress(100);
        setInitializationError(null);
        
        // Small delay to show completion
        setTimeout(() => {
          setIsInitializing(false);
        }, 500);
        
      } catch (error) {
        console.error('❌ Initialization error:', error);
        setInitializationError('Ошибка инициализации компонента');
        setInitializationStage('error');
      }
    };

    initialize();
  }, [isAdmin, user, location.pathname, navigate, forceCompleted]);

  const loadBuyerProfiles = useCallback(async () => {
    console.log('📥 Loading buyer profiles...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .limit(20);

      if (error) throw error;
      setBuyerProfiles(data || []);
      console.log('✅ Buyer profiles loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading buyer profiles:', error);
      throw error;
    }
  }, []);

  const loadSellerProfiles = useCallback(async () => {
    console.log('📥 Loading seller profiles...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'seller')
        .limit(20);

      if (error) throw error;
      setSellerProfiles(data || []);
      console.log('✅ Seller profiles loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading seller profiles:', error);
      throw error;
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
    
    // Enhanced initialization states
    isInitializing,
    initializationError,
    hasAdminAccess: isAdmin === true,
    initializationStage,
    initializationProgress,
    forceComplete
  };
};
