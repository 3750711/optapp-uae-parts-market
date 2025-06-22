
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useSimpleAdminAccess } from '@/hooks/useSimpleAdminAccess';

interface ProfileShort {
  id: string;
  opt_id: string;
  full_name: string;
}

interface SellerProfile extends ProfileShort {
  telegram: string;
}

export const useOptimizedProfiles = (userId?: string) => {
  const { isAdmin } = useSimpleAdminAccess();
  
  // Загружаем профили покупателей только если пользователь админ
  const {
    data: buyerProfiles = [],
    isLoading: isBuyersLoading,
    error: buyersError
  } = useQuery({
    queryKey: ['admin', 'buyer-profiles-optimized'],
    queryFn: async () => {
      console.log('🔍 Fetching buyer profiles with optimization...');
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, opt_id, full_name')
        .eq('user_type', 'buyer')
        .not('opt_id', 'is', null)
        .order('full_name')
        .limit(200); // Увеличил лимит до 200

      if (error) {
        console.error('❌ Error fetching buyer profiles:', error);
        throw error;
      }

      const endTime = performance.now();
      console.log(`✅ Buyer profiles loaded in ${(endTime - startTime).toFixed(2)}ms:`, data?.length || 0);
      return data as ProfileShort[] || [];
    },
    staleTime: 1000 * 60 * 15, // Увеличено до 15 минут кэш
    gcTime: 1000 * 60 * 30, // 30 минут в памяти
    enabled: isAdmin === true,
    refetchOnWindowFocus: false,
  });

  // Загружаем профили продавцов только если пользователь админ
  const {
    data: sellerProfiles = [],
    isLoading: isSellersLoading,
    error: sellersError
  } = useQuery({
    queryKey: ['admin', 'seller-profiles-optimized'],
    queryFn: async () => {
      console.log('🔍 Fetching seller profiles with optimization...');
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, opt_id, full_name, telegram')
        .eq('user_type', 'seller')
        .order('full_name')
        .limit(200); // Увеличил лимит до 200

      if (error) {
        console.error('❌ Error fetching seller profiles:', error);
        throw error;
      }

      const endTime = performance.now();
      console.log(`✅ Seller profiles loaded in ${(endTime - startTime).toFixed(2)}ms:`, data?.length || 0);
      return data as SellerProfile[] || [];
    },
    staleTime: 1000 * 60 * 15, // Увеличено до 15 минут кэш
    gcTime: 1000 * 60 * 30, // 30 минут в памяти
    enabled: isAdmin === true,
    refetchOnWindowFocus: false,
  });

  return {
    buyerProfiles,
    sellerProfiles,
    isLoading: isBuyersLoading || isSellersLoading,
    error: buyersError || sellersError
  };
};
