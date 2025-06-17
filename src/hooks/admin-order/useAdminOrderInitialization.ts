
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { supabase } from '@/integrations/supabase/client';
import { BuyerProfile, SellerProfile, InitializationState } from './types';

export const useAdminOrderInitialization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  const [initState, setInitState] = useState<InitializationState>({
    isInitializing: true,
    error: null,
    stage: 'starting',
    progress: 0
  });

  const [buyerProfiles, setBuyerProfiles] = useState<BuyerProfile[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<SellerProfile[]>([]);
  const [forceCompleted, setForceCompleted] = useState(false);

  const loadBuyerProfiles = useCallback(async (): Promise<void> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, opt_id, telegram')
      .eq('user_type', 'buyer')
      .limit(50);

    if (error) throw error;
    setBuyerProfiles(data as BuyerProfile[] || []);
  }, []);

  const loadSellerProfiles = useCallback(async (): Promise<void> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, opt_id, telegram')
      .eq('user_type', 'seller')
      .limit(50);

    if (error) throw error;
    setSellerProfiles(data as SellerProfile[] || []);
  }, []);

  const forceComplete = useCallback(() => {
    setForceCompleted(true);
    setInitState({
      isInitializing: false,
      error: null,
      stage: 'force_completed',
      progress: 100
    });
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (forceCompleted) return;

      try {
        setInitState(prev => ({ ...prev, stage: 'route_check', progress: 10 }));

        // Route validation
        const validRoutes = ['/admin/free-order', '/admin/orders/create'];
        if (!validRoutes.includes(location.pathname)) {
          setInitState(prev => ({ ...prev, error: 'Неверный маршрут для формы заказа' }));
          navigate('/admin/dashboard');
          return;
        }

        setInitState(prev => ({ ...prev, stage: 'auth_check', progress: 30 }));

        // Admin check with timeout
        const timeout = setTimeout(() => {
          setInitState(prev => ({ 
            ...prev, 
            error: 'Тайм-аут проверки прав доступа',
            stage: 'timeout' 
          }));
        }, 3000);

        // Wait for admin status
        if (isAdmin === null) {
          // Wait a bit more for admin status to resolve
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        clearTimeout(timeout);

        if (isAdmin === false) {
          setInitState(prev => ({ 
            ...prev, 
            error: 'У вас нет прав администратора',
            stage: 'access_denied' 
          }));
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        if (isAdmin === true) {
          setInitState(prev => ({ ...prev, stage: 'loading_data', progress: 60 }));
          
          await Promise.all([
            loadBuyerProfiles(),
            loadSellerProfiles()
          ]);

          setInitState(prev => ({ ...prev, stage: 'completed', progress: 100 }));
          
          setTimeout(() => {
            setInitState(prev => ({ ...prev, isInitializing: false }));
          }, 300);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setInitState(prev => ({ 
          ...prev, 
          error: 'Ошибка инициализации',
          stage: 'error' 
        }));
      }
    };

    initialize();
  }, [isAdmin, user, location.pathname, navigate, forceCompleted, loadBuyerProfiles, loadSellerProfiles]);

  return {
    ...initState,
    buyerProfiles,
    sellerProfiles,
    forceComplete,
    hasAdminAccess: isAdmin === true
  };
};
