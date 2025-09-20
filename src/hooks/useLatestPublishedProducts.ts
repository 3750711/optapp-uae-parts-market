import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublishedProduct {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  delivery_price?: number | null;
  lot_number: number;
  condition: string;
  description?: string;
  tg_views_estimate?: number;
  product_images?: Array<{ url: string; is_primary?: boolean }>;
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
          delivery_price,
          lot_number,
          condition,
          description,
          tg_views_estimate,
          product_images!inner (
            url,
            is_primary
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