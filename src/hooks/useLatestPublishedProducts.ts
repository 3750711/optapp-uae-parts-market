import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublishedProduct {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  price: number;
  delivery_price?: number | null;
  lot_number: number;
  condition: string;
  description?: string;
  product_images?: Array<{ url: string; is_primary?: boolean }>;
  profiles?: {
    opt_id?: string;
    telegram?: string;
  };
}

export const useLatestPublishedProducts = () => {
  return useQuery({
    queryKey: ['latest-published-products'],
    queryFn: async (): Promise<PublishedProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          brand,
          model,
          price,
          delivery_price,
          lot_number,
          condition,
          description,
          product_images!inner (
            url,
            is_primary
          ),
          profiles!inner (
            opt_id,
            telegram
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};