
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .not('opt_id', 'is', null)
        .limit(100);

      if (error) throw error;
      setBuyerProfiles((data || []).map(profile => ({
        ...profile,
        user_type: 'buyer' as const
      })));
    } catch (error) {
      console.error('Error loading buyer profiles:', error);
      throw new Error('Не удалось загрузить профили покупателей');
    }
  }, []);

  const loadSellerProfiles = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'seller')
        .limit(100);

      if (error) throw error;
      setSellerProfiles((data || []).map(profile => ({
        ...profile,
        user_type: 'seller' as const
      })));
    } catch (error) {
      console.error('Error loading seller profiles:', error);
      throw new Error('Не удалось загрузить профили продавцов');
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Проверка маршрута
        const validRoutes = ['/admin/free-order', '/admin/orders/create'];
        if (!validRoutes.includes(location.pathname)) {
          setInitState({ isInitializing: false, error: 'Неверный маршрут' });
          navigate('/admin/dashboard');
          return;
        }

        // Проверка прав администратора
        if (isAdmin === false) {
          setInitState({ isInitializing: false, error: 'Нет прав администратора' });
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Ждем определения прав администратора
        if (isAdmin === null) {
          return; // Еще загружается
        }

        // Загружаем данные
        await Promise.all([
          loadBuyerProfiles(),
          loadSellerProfiles()
        ]);

        setInitState({ isInitializing: false, error: null });
      } catch (error) {
        console.error('Initialization error:', error);
        setInitState({ 
          isInitializing: false, 
          error: error instanceof Error ? error.message : 'Ошибка инициализации'
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
