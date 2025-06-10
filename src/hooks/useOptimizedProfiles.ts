
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface ProfileShort {
  id: string;
  opt_id: string;
  full_name: string;
}

interface SellerProfile extends ProfileShort {
  telegram: string;
}

export const useOptimizedProfiles = (userId?: string) => {
  const { isAdmin } = useAuth();
  
  // Загружаем профили покупателей только если пользователь админ
  const {
    data: buyerProfiles = [],
    isLoading: isBuyersLoading,
    error: buyersError
  } = useQuery({
    queryKey: ['admin', 'buyer-profiles'],
    queryFn: async () => {
      console.log('🔍 Fetching buyer profiles with optimization...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, opt_id, full_name')
        .eq('user_type', 'buyer')
        .not('opt_id', 'is', null)
        .limit(100); // Лимитируем результат

      if (error) {
        console.error('❌ Error fetching buyer profiles:', error);
        throw error;
      }

      console.log('✅ Buyer profiles loaded:', data?.length || 0);
      return data as ProfileShort[] || [];
    },
    staleTime: 1000 * 60 * 5, // 5 минут кэш
    gcTime: 1000 * 60 * 10, // 10 минут в памяти
    enabled: isAdmin === true, // Загружаем только если точно известно что пользователь админ
  });

  // Загружаем профили продавцов только если пользователь админ
  const {
    data: sellerProfiles = [],
    isLoading: isSellersLoading,
    error: sellersError
  } = useQuery({
    queryKey: ['admin', 'seller-profiles'],
    queryFn: async () => {
      console.log('🔍 Fetching seller profiles with optimization...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, opt_id, full_name, telegram')
        .eq('user_type', 'seller')
        .limit(100); // Лимитируем результат

      if (error) {
        console.error('❌ Error fetching seller profiles:', error);
        throw error;
      }

      console.log('✅ Seller profiles loaded:', data?.length || 0);
      return data as SellerProfile[] || [];
    },
    staleTime: 1000 * 60 * 5, // 5 минут кэш
    gcTime: 1000 * 60 * 10, // 10 минут в памяти
    enabled: isAdmin === true,
  });

  return {
    buyerProfiles,
    sellerProfiles,
    isLoading: isBuyersLoading || isSellersLoading,
    error: buyersError || sellersError
  };
};
