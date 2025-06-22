
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { supabase } from '@/integrations/supabase/client';
import { BuyerProfile, SellerProfile } from '@/types/order';

interface InitializationState {
  isInitializing: boolean;
  error: string | null;
}

export const useAdminOrderInitialization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  const [initState, setInitState] = useState<InitializationState>({
    isInitializing: true,
    error: null
  });

  const [buyerProfiles, setBuyerProfiles] = useState<BuyerProfile[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<SellerProfile[]>([]);

  const loadBuyerProfiles = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Loading buyer profiles...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .not('opt_id', 'is', null)
        .neq('opt_id', '')
        .order('opt_id', { ascending: true })
        .limit(200);

      if (error) {
        console.error('❌ Error loading buyer profiles:', error);
        throw new Error(`Ошибка загрузки профилей покупателей: ${error.message}`);
      }

      const profiles = (data || [])
        .filter(profile => profile.opt_id && profile.opt_id.trim()) // Дополнительная фильтрация
        .map(profile => ({
          ...profile,
          user_type: 'buyer' as const
        }));

      console.log('✅ Loaded buyer profiles:', profiles.length);
      console.log('📋 Sample OPT_IDs:', profiles.slice(0, 5).map(p => p.opt_id));
      setBuyerProfiles(profiles);
    } catch (error) {
      console.error('❌ Exception in loadBuyerProfiles:', error);
      throw error;
    }
  }, []);

  const loadSellerProfiles = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Loading seller profiles...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'seller')
        .order('full_name', { ascending: true })
        .limit(200);

      if (error) {
        console.error('❌ Error loading seller profiles:', error);
        throw new Error(`Ошибка загрузки профилей продавцов: ${error.message}`);
      }

      const profiles = (data || []).map(profile => ({
        ...profile,
        user_type: 'seller' as const
      }));

      console.log('✅ Loaded seller profiles:', profiles.length);
      setSellerProfiles(profiles);
    } catch (error) {
      console.error('❌ Exception in loadSellerProfiles:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🚀 Starting admin order initialization...');
        
        // Проверка маршрута
        const validRoutes = ['/admin/free-order', '/admin/orders/create'];
        if (!validRoutes.includes(location.pathname)) {
          console.warn('⚠️ Invalid route:', location.pathname);
          setInitState({ isInitializing: false, error: 'Неверный маршрут' });
          navigate('/admin/dashboard');
          return;
        }

        // Проверка прав администратора
        if (isAdmin === false) {
          console.warn('⚠️ User is not admin');
          setInitState({ isInitializing: false, error: 'Нет прав администратора' });
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Ждем определения прав администратора
        if (isAdmin === null) {
          console.log('⏳ Waiting for admin access check...');
          return; // Еще загружается
        }

        console.log('✅ Admin access confirmed, loading data...');

        // Загружаем данные с обработкой ошибок
        await Promise.all([
          loadBuyerProfiles(),
          loadSellerProfiles()
        ]);

        console.log('✅ All initialization data loaded successfully');
        setInitState({ isInitializing: false, error: null });
      } catch (error) {
        console.error('❌ Initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ошибка инициализации';
        setInitState({ 
          isInitializing: false, 
          error: errorMessage
        });
      }
    };

    initialize();
  }, [isAdmin, location.pathname, navigate, loadBuyerProfiles, loadSellerProfiles]);

  return {
    ...initState,
    buyerProfiles,
    sellerProfiles,
    hasAdminAccess: isAdmin === true
  };
};
