
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
const CACHE_DURATION = 30 * 60 * 1000; // Увеличили до 30 минут
const BUYERS_CACHE_KEY = 'adminSellProduct_buyers';

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

  // Восстановление состояния из localStorage с оптимизацией
  useEffect(() => {
    const restoreState = () => {
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
          } else {
            // Очищаем устаревший кэш
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error restoring state from localStorage:', error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    };

    restoreState();
  }, []);

  // Оптимизированное сохранение состояния в localStorage
  const saveStateToStorage = useCallback((newState: Partial<SellProductState>) => {
    // Используем requestIdleCallback для отложенного сохранения
    const saveOperation = () => {
      try {
        const stateToSave = {
          step: newState.step ?? state.step,
          selectedProduct: newState.selectedProduct ?? state.selectedProduct,
          selectedBuyer: newState.selectedBuyer ?? state.selectedBuyer,
          buyers: newState.buyers ?? state.buyers
        };
        
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          data: stateToSave,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error saving state to localStorage:', error);
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(saveOperation);
    } else {
      setTimeout(saveOperation, 0);
    }
  }, [state]);

  // Обновление состояния с оптимизированным сохранением
  const updateState = useCallback((updates: Partial<SellProductState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      // Сохраняем только если есть значимые изменения
      const hasSignificantChanges = 
        updates.step !== undefined ||
        updates.selectedProduct !== undefined ||
        updates.selectedBuyer !== undefined ||
        updates.buyers !== undefined;
      
      if (hasSignificantChanges) {
        saveStateToStorage(newState);
      }
      
      return newState;
    });
  }, [saveStateToStorage]);

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

  // Сброс состояния с очисткой кэша
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

  // Очистка всего кэша
  const clearCache = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(BUYERS_CACHE_KEY);
  }, []);

  return {
    state,
    updateState,
    loadBuyers,
    resetState,
    clearCache
  };
};
