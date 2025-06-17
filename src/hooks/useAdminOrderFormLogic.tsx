
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
  handleBrandChange: (brandId: string, brandName: string) => void;
  handleModelChange: (modelId: string, modelName: string) => void;
  
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

  // Form data state with default values
  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    price: '',
    buyerOptId: '',
    brand: '',
    model: '',
    brandId: '',
    modelId: '',
    sellerId: '',
    deliveryMethod: 'cargo_rf' as const,
    place_number: '1',
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
    setModelSearchTerm,
    selectBrand
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

  // Valid order statuses from database enum
  const validOrderStatuses = ['created', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'declined'] as const;

  // Function to validate order status
  const validateOrderStatus = useCallback((status: string): boolean => {
    return validOrderStatuses.includes(status as any);
  }, []);

  // Enhanced brand selection with model loading
  const handleBrandChange = useCallback((brandId: string, brandName: string) => {
    console.log('🏷️ Brand changed:', { brandId, brandName });
    
    setFormData(prev => ({
      ...prev,
      brandId,
      brand: brandName,
      // Reset model when brand changes
      modelId: '',
      model: ''
    }));

    // Load models for selected brand
    if (brandId) {
      console.log('📥 Loading models for brand:', brandId);
      selectBrand(brandId);
    }
  }, [selectBrand]);

  // Enhanced model selection
  const handleModelChange = useCallback((modelId: string, modelName: string) => {
    console.log('🚗 Model changed:', { modelId, modelName });
    
    setFormData(prev => ({
      ...prev,
      modelId,
      model: modelName
    }));
  }, []);

  // Function to find buyer by opt_id
  const findBuyerByOptId = useCallback(async (optId: string) => {
    console.log('🔍 Searching for buyer with opt_id:', optId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .eq('opt_id', optId)
        .single();

      if (error) {
        console.error('❌ Error finding buyer:', error);
        return null;
      }

      console.log('✅ Found buyer:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception in findBuyerByOptId:', error);
      return null;
    }
  }, []);

  // Function to get seller name
  const getSellerName = useCallback(async (sellerId: string) => {
    console.log('🔍 Getting seller name for ID:', sellerId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sellerId)
        .single();

      if (error) {
        console.error('❌ Error getting seller name:', error);
        return 'Unknown Seller';
      }

      return data.full_name || 'Unknown Seller';
    } catch (error) {
      console.error('❌ Exception in getSellerName:', error);
      return 'Unknown Seller';
    }
  }, []);

  // Enhanced form validation
  const validateForm = useCallback(async () => {
    const errors: string[] = [];

    // Required fields validation
    if (!formData.title?.trim()) {
      errors.push('Название заказа обязательно');
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Цена должна быть больше 0');
    }
    if (!formData.buyerOptId?.trim()) {
      errors.push('OPT_ID покупателя обязателен');
    }

    // Validate buyer exists
    if (formData.buyerOptId?.trim()) {
      const buyer = await findBuyerByOptId(formData.buyerOptId.trim());
      if (!buyer) {
        errors.push(`Покупатель с OPT_ID "${formData.buyerOptId}" не найден`);
      }
    }

    // Validate seller if specified
    if (formData.sellerId) {
      const sellerName = await getSellerName(formData.sellerId);
      if (sellerName === 'Unknown Seller') {
        errors.push('Выбранный продавец не найден');
      }
    }

    // Validate delivery method
    const validDeliveryMethods = ['self_pickup', 'delivery', 'cargo_rf'];
    if (!validDeliveryMethods.includes(formData.deliveryMethod)) {
      errors.push('Некорректный способ доставки');
    }

    return errors;
  }, [formData, findBuyerByOptId, getSellerName]);

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
            // Auto-select found brand and model
            handleBrandChange(brand.id, brand.name);
            handleModelChange(model.id, model.name);
            return { brand: brand.name, model: model.name };
          }
        }
        // Auto-select found brand
        handleBrandChange(brand.id, brand.name);
        return { brand: brand.name, model: '' };
      }
    }
    return { brand: '', model: '' };
  }, [brands, brandModels, handleBrandChange, handleModelChange]);

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
    
    if (field === 'brandId') {
      const selectedBrand = brands.find(b => b.id === value);
      if (selectedBrand) {
        handleBrandChange(value, selectedBrand.name);
      }
    } else if (field === 'modelId') {
      const selectedModel = brandModels.find(m => m.id === value);
      if (selectedModel) {
        handleModelChange(value, selectedModel.name);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, [brands, brandModels, handleBrandChange, handleModelChange]);

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

  // Enhanced handleSubmit with validation and better error handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setCreationStage('validating');
      setCreationProgress(10);

      console.log('📋 Starting order creation with form validation...');

      // Enhanced validation
      const validationErrors = await validateForm();
      if (validationErrors.length > 0) {
        toast({
          title: "Ошибки валидации",
          description: validationErrors.join('. '),
          variant: "destructive"
        });
        return;
      }

      setCreationStage('fetching_buyer');
      setCreationProgress(30);

      // Find buyer by opt_id
      const buyer = await findBuyerByOptId(formData.buyerOptId.trim());
      if (!buyer) {
        throw new Error(`Покупатель с OPT_ID "${formData.buyerOptId}" не найден`);
      }

      setCreationStage('creating_order');
      setCreationProgress(50);

      // Get seller name
      const sellerIdToUse = formData.sellerId || user?.id;
      const sellerName = sellerIdToUse ? await getSellerName(sellerIdToUse) : 'Unknown Seller';

      // Create order with all required fields - let database use default status 'created'
      const orderData = {
        title: formData.title.trim(),
        price: parseFloat(formData.price),
        buyer_id: buyer.id,
        buyer_opt_id: buyer.opt_id,
        seller_id: sellerIdToUse,
        order_seller_name: sellerName,
        brand: formData.brand?.trim() || '',
        model: formData.model?.trim() || '',
        delivery_method: formData.deliveryMethod || 'cargo_rf',
        place_number: parseInt(formData.place_number) || 1,
        text_order: formData.text_order?.trim() || '',
        delivery_price: parseFloat(formData.delivery_price) || 0,
        quantity: 1, // Default quantity
        images,
        video_url: videos,
        created_by: user?.id,
        // Enhanced metadata
        order_created_type: 'free' as const,
        // Remove status - let database use default 'created'
        telegram_url_buyer: buyer.telegram || '',
        telegram_url_order: ''
      };

      console.log('💾 Creating order with complete data:', orderData);

      // Use the admin function for creating orders - it will use database default status
      const { data: order, error } = await supabase.rpc('admin_create_order', {
        p_title: orderData.title,
        p_price: orderData.price,
        p_place_number: orderData.place_number,
        p_seller_id: orderData.seller_id,
        p_order_seller_name: orderData.order_seller_name,
        p_seller_opt_id: '', // Will be filled by trigger
        p_buyer_id: orderData.buyer_id,
        p_brand: orderData.brand,
        p_model: orderData.model,
        p_status: 'created', // Use correct status from database enum
        p_order_created_type: 'free',
        p_telegram_url_order: orderData.telegram_url_order,
        p_images: orderData.images,
        p_product_id: null,
        p_delivery_method: orderData.delivery_method,
        p_text_order: orderData.text_order,
        p_delivery_price_confirm: orderData.delivery_price
      });

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Ошибка базы данных: ${error.message}`);
      }

      setCreationStage('fetching_order');
      setCreationProgress(80);

      // Fetch the created order
      const { data: fetchedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching created order:', fetchError);
        throw fetchError;
      }

      setCreationStage('completed');
      setCreationProgress(100);
      setCreatedOrder(fetchedOrder);

      console.log('✅ Order created successfully:', fetchedOrder);

      toast({
        title: "Заказ создан",
        description: `Заказ #${fetchedOrder.order_number} успешно создан в системе`,
      });

    } catch (error) {
      console.error('💥 Order creation error:', error);
      
      let errorMessage = "Произошла неожиданная ошибка";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Ошибка создания заказа",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, images, videos, user?.id, toast, validateForm, findBuyerByOptId, getSellerName]);

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
      deliveryMethod: 'cargo_rf' as const,
      place_number: '1',
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
    
    // Car data with enhanced handlers
    brands,
    brandModels,
    isLoadingCarData,
    searchBrandTerm: brandSearchTerm,
    setSearchBrandTerm: setBrandSearchTerm,
    searchModelTerm: modelSearchTerm,
    setSearchModelTerm: setModelSearchTerm,
    filteredBrands,
    filteredModels,
    handleBrandChange,
    handleModelChange,
    
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
