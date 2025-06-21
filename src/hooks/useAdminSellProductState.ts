
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
  lot_number: number;
  seller_id: string;
  seller_name: string;
}

interface SellProductState {
  step: number;
  selectedProduct: Product | null;
  selectedBuyer: BuyerProfile | null;
  buyers: BuyerProfile[];
  isLoading: boolean;
  showConfirmDialog: boolean;
  showConfirmImagesDialog: boolean;
  createdOrder: any;
  createdOrderImages: string[];
}

const LOCAL_STORAGE_KEY = 'adminSellProductState';
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export const useAdminSellProductState = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<SellProductState>({
    step: 1,
    selectedProduct: null,
    selectedBuyer: null,
    buyers: [],
    isLoading: false,
    showConfirmDialog: false,
    showConfirmImagesDialog: false,
    createdOrder: null,
    createdOrderImages: []
  });

  // Восстановление состояния из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setState(prevState => ({
            ...prevState,
            ...data,
            // Сбрасываем временные состояния
            isLoading: false,
            showConfirmDialog: false,
            showConfirmImagesDialog: false,
            createdOrder: null,
            createdOrderImages: []
          }));
        }
      }
    } catch (error) {
      console.error('Error restoring state from localStorage:', error);
    }
  }, []);

  // Сохранение состояния в localStorage
  const saveStateToStorage = useCallback((newState: Partial<SellProductState>) => {
    try {
      const stateToSave = {
        step: newState.step || state.step,
        selectedProduct: newState.selectedProduct || state.selectedProduct,
        selectedBuyer: newState.selectedBuyer || state.selectedBuyer,
        buyers: newState.buyers || state.buyers
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        data: stateToSave,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [state]);

  // Обновление состояния с сохранением
  const updateState = useCallback((updates: Partial<SellProductState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      saveStateToStorage(newState);
      return newState;
    });
  }, [saveStateToStorage]);

  // Загрузка покупателей с кэшированием
  const loadBuyers = useCallback(async () => {
    const cacheKey = 'adminSellProduct_buyers';
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          updateState({ buyers: data });
          return;
        }
      } catch (error) {
        console.error('Error parsing cached buyers:', error);
      }
    }

    updateState({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, opt_id, telegram")
        .eq("user_type", "buyer")
        .not("opt_id", "is", null)
        .order("full_name");

      if (error) {
        throw error;
      }

      const buyers = data || [];
      updateState({ buyers, isLoading: false });
      
      // Кэшируем результат
      localStorage.setItem(cacheKey, JSON.stringify({
        data: buyers,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error loading buyers:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список покупателей",
        variant: "destructive",
      });
      updateState({ isLoading: false });
    }
  }, [updateState, toast]);

  // Сброс состояния
  const resetState = useCallback(() => {
    setState({
      step: 1,
      selectedProduct: null,
      selectedBuyer: null,
      buyers: state.buyers, // Сохраняем загруженных покупателей
      isLoading: false,
      showConfirmDialog: false,
      showConfirmImagesDialog: false,
      createdOrder: null,
      createdOrderImages: []
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, [state.buyers]);

  // Очистка кэша
  const clearCache = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem('adminSellProduct_buyers');
  }, []);

  return {
    state,
    updateState,
    loadBuyers,
    resetState,
    clearCache
  };
};
