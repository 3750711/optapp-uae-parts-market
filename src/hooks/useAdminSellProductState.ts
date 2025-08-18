
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedFormAutosave } from './useOptimizedFormAutosave';

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
  place_number?: number;
}

interface SellProductState {
  step: number; // 1 - выбор товара, 2 - выбор покупателя, 3 - подтверждение заказа
  selectedProduct: Product | null;
  selectedBuyer: BuyerProfile | null;
  buyers: BuyerProfile[];
  isLoading: boolean;
  createdOrder: any;
  createdOrderImages: string[];
}

interface AutosaveData {
  step: number;
  selectedProduct: Product | null;
  selectedBuyer: BuyerProfile | null;
}

const BUYERS_CACHE_KEY = 'adminSellProduct_buyers';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useAdminSellProductState = () => {
  const { toast } = useToast();
  
  const [state, setState] = useState<SellProductState>({
    step: 1,
    selectedProduct: null,
    selectedBuyer: null,
    buyers: [],
    isLoading: false,
    createdOrder: null,
    createdOrderImages: []
  });

  // Prepare autosave data
  const autosaveData: AutosaveData = {
    step: state.step,
    selectedProduct: state.selectedProduct,
    selectedBuyer: state.selectedBuyer,
  };

  // Setup autosave
  const {
    loadSavedData,
    clearSavedData,
    draftExists,
    saveNow
  } = useOptimizedFormAutosave({
    key: 'admin_sell_product',
    data: autosaveData,
    delay: 2000,
    enabled: !!state.selectedProduct || !!state.selectedBuyer || state.step > 1,
    excludeFields: []
  });

  const updateState = useCallback((updates: Partial<SellProductState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Оптимизированная загрузка покупателей с RPC функцией
  const loadBuyers = useCallback(async () => {
    // Проверяем кэш покупателей
    const cached = localStorage.getItem(BUYERS_CACHE_KEY);
    
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          updateState({ buyers: data });
          return;
        }
      } catch (error) {
        console.error('Error parsing cached buyers:', error);
        localStorage.removeItem(BUYERS_CACHE_KEY);
      }
    }

    updateState({ isLoading: true });
    
    try {
      // Используем оптимизированный запрос с серверной фильтрацией
      const { data, error } = await supabase.rpc('get_active_buyers', {
        limit_count: 100 // Ограничиваем количество для производительности
      });

      if (error) {
        // Fallback на обычный запрос если RPC функция недоступна
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("profiles")
          .select("id, full_name, opt_id, telegram")
          .eq("user_type", "buyer")
          .not("opt_id", "is", null)
          .order("full_name")
          .limit(100);

        if (fallbackError) throw fallbackError;
        
        const buyers = fallbackData || [];
        updateState({ buyers, isLoading: false });
        
        // Кэшируем результат с оптимизацией
        try {
          localStorage.setItem(BUYERS_CACHE_KEY, JSON.stringify({
            data: buyers,
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          console.warn('Failed to cache buyers:', cacheError);
        }
        
        return;
      }

      const buyers = data || [];
      updateState({ buyers, isLoading: false });
      
      // Кэшируем результат
      try {
        localStorage.setItem(BUYERS_CACHE_KEY, JSON.stringify({
          data: buyers,
          timestamp: Date.now()
        }));
      } catch (cacheError) {
        console.warn('Failed to cache buyers:', cacheError);
      }
      
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

  const resetState = useCallback(() => {
    setState({
      step: 1,
      selectedProduct: null,
      selectedBuyer: null,
      buyers: state.buyers, // Сохраняем загруженных покупателей
      isLoading: false,
      createdOrder: null,
      createdOrderImages: []
    });
    clearSavedData();
  }, [state.buyers, clearSavedData]);

  // Очистка кэша покупателей
  const clearCache = useCallback(() => {
    localStorage.removeItem(BUYERS_CACHE_KEY);
  }, []);

  // Restore saved state
  const restoreSavedState = useCallback(() => {
    const savedData = loadSavedData();
    if (savedData) {
      console.log('🔄 Restoring saved sell product state:', savedData);
      setState(prevState => ({
        ...prevState,
        step: savedData.step || 1,
        selectedProduct: savedData.selectedProduct || null,
        selectedBuyer: savedData.selectedBuyer || null,
      }));
      
      toast({
        title: "Состояние восстановлено",
        description: "Ваш прогресс был автоматически восстановлен",
      });
      
      return true;
    }
    return false;
  }, [loadSavedData, toast]);

  return {
    state,
    updateState,
    loadBuyers,
    resetState,
    clearCache,
    restoreSavedState,
    clearSavedData,
    draftExists,
    saveNow
  };
};
