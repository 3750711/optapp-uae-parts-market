
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedFormAutosave } from './useOptimizedFormAutosave';
import { Product } from '@/types/product';

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
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

  // Оптимизированная загрузка покупателей с улучшенной обработкой ошибок
  const loadBuyers = useCallback(async () => {
    console.log('🔄 Starting buyer loading process...');
    
    // Проверяем кэш покупателей
    const cached = localStorage.getItem(BUYERS_CACHE_KEY);
    
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('✅ Using cached buyers:', data.length, 'buyers found');
          updateState({ buyers: data });
          return;
        }
        console.log('⏰ Cache expired, loading fresh data...');
      } catch (error) {
        console.error('❌ Error parsing cached buyers:', error);
        localStorage.removeItem(BUYERS_CACHE_KEY);
      }
    } else {
      console.log('📭 No cached buyers found, loading from database...');
    }

    updateState({ isLoading: true });
    
    try {
      console.log('🔍 Attempting RPC call to get_active_buyers...');
      // Используем оптимизированный запрос с серверной фильтрацией
      const { data, error } = await supabase.rpc('get_active_buyers', {
        limit_count: 100 // Ограничиваем количество для производительности
      });

      if (error) {
        console.warn('⚠️ RPC function failed, falling back to direct query. RPC Error:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        
        // Fallback на обычный запрос если RPC функция недоступна
        console.log('🔄 Attempting direct query to profiles table...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("profiles")
          .select("id, full_name, opt_id, telegram")
          .eq("user_type", "buyer")
          .eq("verification_status", "verified") // Только верифицированные покупатели
          .not("opt_id", "is", null)
          .neq("opt_id", "")
          .order("opt_id")
          .limit(100);

        if (fallbackError) {
          console.error('❌ Direct query failed:', {
            message: fallbackError.message,
            code: fallbackError.code,
            details: fallbackError.details,
            hint: fallbackError.hint
          });
          
          // Проверяем, является ли это ошибкой доступа
          if (fallbackError.code === 'PGRST301' || fallbackError.message.includes('permission')) {
            console.error('🚫 Access denied - RLS policy may be blocking seller access to buyer profiles');
            throw new Error('Нет доступа к профилям покупателей. Проверьте права доступа.');
          }
          
          throw fallbackError;
        }
        
        const buyers = (fallbackData || []).filter(buyer => 
          buyer.opt_id && buyer.opt_id.trim() !== '' && buyer.full_name && buyer.full_name.trim() !== ''
        );
        
        console.log('✅ Direct query successful:', buyers.length, 'verified buyers loaded');
        updateState({ buyers, isLoading: false });
        
        // Кэшируем результат с оптимизацией
        try {
          localStorage.setItem(BUYERS_CACHE_KEY, JSON.stringify({
            data: buyers,
            timestamp: Date.now()
          }));
          console.log('💾 Buyers cached successfully');
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache buyers:', cacheError);
        }
        
        return;
      }

      const buyers = (data || []).filter(buyer => 
        buyer.opt_id && buyer.opt_id.trim() !== '' && buyer.full_name && buyer.full_name.trim() !== ''
      );
      
      console.log('✅ RPC call successful:', buyers.length, 'buyers loaded via RPC');
      updateState({ buyers, isLoading: false });
      
      // Кэшируем результат
      try {
        localStorage.setItem(BUYERS_CACHE_KEY, JSON.stringify({
          data: buyers,
          timestamp: Date.now()
        }));
        console.log('💾 Buyers cached successfully');
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache buyers:', cacheError);
      }
      
    } catch (error: any) {
      console.error("❌ Critical error loading buyers:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      
      // Улучшенное сообщение об ошибке для пользователя
      let userMessage = "Не удалось загрузить список покупателей";
      let description = "Попробуйте обновить страницу или обратитесь к администратору";
      
      if (error.message?.includes('доступа') || error.message?.includes('permission')) {
        userMessage = "Нет доступа к данным покупателей";
        description = "Убедитесь, что у вас есть права продавца и обратитесь к администратору";
      } else if (error.code === 'PGRST301') {
        userMessage = "Ошибка прав доступа";
        description = "Политики безопасности блокируют доступ к профилям покупателей";
      }
      
      toast({
        title: userMessage,
        description: description,
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
