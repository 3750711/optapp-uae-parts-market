import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseSellerOrdersQueryParams {
  sellerId?: string;
  searchTerm?: string;
  pageSize?: number;
}

export const useSellerOrdersQuery = ({
  sellerId,
  searchTerm = '',
  pageSize = 20
}: UseSellerOrdersQueryParams) => {
  return useInfiniteQuery({
    queryKey: ['seller-orders', sellerId, searchTerm, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      if (!sellerId) return { data: [], hasMore: false, totalCount: 0 };

      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            buyer:buyer_id(
              full_name,
              opt_id,
              opt_status
            )
          `, { count: 'exact' })
          .or(`seller_id.eq.${sellerId},order_created_type.eq.ads_order`);

        // Apply search filters if searchTerm exists
        if (searchTerm && searchTerm.trim() !== '') {
          const searchValue = searchTerm.trim();
          
          // Check if searchValue is a number for lot_number_order search
          const isNumeric = !isNaN(Number(searchValue)) && searchValue !== '';
          
          if (isNumeric) {
            // If it's numeric, search in all fields including lot_number_order
            query = query.or(
              `title.ilike.%${searchValue}%,brand.ilike.%${searchValue}%,model.ilike.%${searchValue}%,lot_number_order.eq.${searchValue}`
            );
          } else {
            // If not numeric, only search in text fields
            query = query.or(
              `title.ilike.%${searchValue}%,brand.ilike.%${searchValue}%,model.ilike.%${searchValue}%`
            );
          }
        }

        const { data, error, count } = await query
          .order('status', { ascending: true })
          .order('created_at', { ascending: false })
          .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

        if (error) {
          console.error('Error fetching seller orders:', error);
          toast.error('Ошибка при загрузке заказов');
          throw error;
        }

        const hasMore = data && data.length === pageSize;
        const totalCount = count || 0;

        return {
          data: data || [],
          hasMore,
          totalCount,
          nextPage: hasMore ? pageParam + 1 : undefined
        };
      } catch (error) {
        console.error('Error in useSellerOrdersQuery:', error);
        toast.error('Ошибка при загрузке заказов');
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    enabled: !!sellerId,
  });
};