
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
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  
  // Images and videos
  images: string[];
  videos: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setVideos: React.Dispatch<React.SetStateAction<string[]>>;
  handleImageUpload: (urls: string[]) => void;
  
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
    isLoadingBrands,
    isLoadingModels,
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

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        
        if (!isAdmin) {
          setInitializationError('У вас нет прав для доступа к этой странице');
          return;
        }

        // Load initial data
        await Promise.all([
          loadBuyerProfiles(),
          loadSellerProfiles()
        ]);

        setInitializationError(null);
      } catch (error) {
        console.error('Initialization error:', error);
        setInitializationError('Ошибка инициализации компонента');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isAdmin]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleImageUpload = useCallback((urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  }, []);

  const parseTitleForBrand = useCallback((title: string) => {
    // Simple parsing logic - can be enhanced
    const words = title.split(' ');
    return {
      brand: words[0] || '',
      model: words.slice(1).join(' ') || ''
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setCreationStage('validating');
      setCreationProgress(10);

      // Validation
      if (!formData.title || !formData.price || !formData.buyerOptId) {
        throw new Error('Заполните все обязательные поля');
      }

      setCreationStage('creating_order');
      setCreationProgress(50);

      // Create order logic here
      const orderData = {
        title: formData.title,
        price: parseFloat(formData.price),
        buyer_opt_id: formData.buyerOptId,
        brand: formData.brand,
        model: formData.model,
        seller_id: formData.sellerId,
        delivery_method: formData.deliveryMethod,
        place_number: parseInt(formData.place_number) || 1,
        text_order: formData.text_order,
        delivery_price: parseFloat(formData.delivery_price) || 0,
        images,
        video_url: videos,
        created_by: user?.id
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      setCreationStage('completed');
      setCreationProgress(100);
      setCreatedOrder(order);

      toast({
        title: "Заказ создан",
        description: "Заказ успешно создан в системе",
      });

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при создании заказа",
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
    
    // Profiles
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    
    // Car data
    brands,
    brandModels,
    isLoadingCarData: isLoadingBrands || isLoadingModels,
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
    
    // Initialization states
    isInitializing,
    initializationError,
    hasAdminAccess: isAdmin
  };
};
