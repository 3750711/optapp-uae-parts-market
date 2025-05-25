
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type StatusFilterType = 'all' | Database['public']['Enums']['order_status'];

export type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
    opt_status: string | null;
  } | null;
};

interface UseOptimizedOrdersQueryParams {
  statusFilter: StatusFilterType;
  searchTerm: string;
  page: number;
  pageSize: number;
}

interface OrdersResponse {
  data: Order[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const useOptimizedOrdersQuery = ({
  statusFilter,
  searchTerm,
  page,
  pageSize
}: UseOptimizedOrdersQueryParams) => {
  return useQuery({
    queryKey: ['admin-orders-optimized', statusFilter, searchTerm, page, pageSize],
    queryFn: async (): Promise<OrdersResponse> => {
      const offset = (page - 1) * pageSize;
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone
          ),
          seller:profiles!orders_seller_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone,
            opt_status
          )
        `, { count: 'exact' })
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        const isNumeric = !isNaN(Number(searchTerm));
        
        if (isNumeric) {
          query = query.or(
            `order_number.eq.${Number(searchTerm)},` +
            `title.ilike.%${searchTerm}%,` +
            `brand.ilike.%${searchTerm}%,` +
            `model.ilike.%${searchTerm}%,` +
            `buyer_opt_id.ilike.%${searchTerm}%,` +
            `seller_opt_id.ilike.%${searchTerm}%,` +
            `text_order.ilike.%${searchTerm}%`
          );
        } else {
          query = query.or(
            `title.ilike.%${searchTerm}%,` +
            `brand.ilike.%${searchTerm}%,` +
            `model.ilike.%${searchTerm}%,` +
            `buyer_opt_id.ilike.%${searchTerm}%,` +
            `seller_opt_id.ilike.%${searchTerm}%,` +
            `text_order.ilike.%${searchTerm}%`
          );
        }
      }

      const { data, error, count } = await query;

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить заказы",
          variant: "destructive",
        });
        console.error("Ошибка загрузки заказов:", error);
        throw error;
      }

      const totalCount = count || 0;
      const hasNextPage = offset + pageSize < totalCount;
      const hasPreviousPage = page > 1;

      return {
        data: data as Order[],
        totalCount,
        hasNextPage,
        hasPreviousPage
      };
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
