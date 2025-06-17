
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BuyerProfile, SellerProfile } from '@/types/order';

export const useLazyProfiles = () => {
  const [shouldLoadBuyers, setShouldLoadBuyers] = useState(false);
  const [shouldLoadSellers, setShouldLoadSellers] = useState(false);

  // Загрузка покупателей только при необходимости
  const {
    data: buyerProfiles = [],
    isLoading: isLoadingBuyers
  } = useQuery<BuyerProfile[]>({
    queryKey: ['lazy-buyer-profiles'],
    queryFn: async () => {
      console.log('🔄 Загрузка профилей покупателей');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .not('opt_id', 'is', null)
        .neq('opt_id', '')
        .order('opt_id', { ascending: true })
        .limit(100); // Ограничиваем для быстрой загрузки

      if (error) {
        console.error('❌ Ошибка загрузки покупателей:', error);
        throw error;
      }

      const profiles = (data || [])
        .filter(profile => profile.opt_id && profile.opt_id.trim())
        .map(profile => ({
          ...profile,
          user_type: 'buyer' as const
        }));

      console.log('✅ Загружено покупателей:', profiles.length);
      return profiles;
    },
    enabled: shouldLoadBuyers,
    staleTime: 3 * 60 * 1000, // Кэшируем на 3 минуты
  });

  // Загрузка продавцов только при необходимости
  const {
    data: sellerProfiles = [],
    isLoading: isLoadingSellers
  } = useQuery<SellerProfile[]>({
    queryKey: ['lazy-seller-profiles'],
    queryFn: async () => {
      console.log('🔄 Загрузка профилей продавцов');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'seller')
        .order('full_name', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Ошибка загрузки продавцов:', error);
        throw error;
      }

      const profiles = (data || []).map(profile => ({
        ...profile,
        user_type: 'seller' as const
      }));

      console.log('✅ Загружено продавцов:', profiles.length);
      return profiles;
    },
    enabled: shouldLoadSellers,
    staleTime: 3 * 60 * 1000,
  });

  const enableBuyersLoading = useCallback(() => {
    setShouldLoadBuyers(true);
  }, []);

  const enableSellersLoading = useCallback(() => {
    setShouldLoadSellers(true);
  }, []);

  return {
    buyerProfiles,
    sellerProfiles,
    isLoadingBuyers,
    isLoadingSellers,
    enableBuyersLoading,
    enableSellersLoading,
    shouldLoadBuyers,
    shouldLoadSellers
  };
};
