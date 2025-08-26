import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { prodError } from "@/utils/logger";
import { endOfDay } from 'date-fns';

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
    user_type: string | null;
  } | null;
  updated_at?: string;
};

interface UseOptimizedOrdersQueryParams {
  statusFilter: StatusFilterType;
  searchTerm: string;
  page: number;
  pageSize: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  dateRange?: { from: Date | null, to: Date | null };
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
  pageSize,
  sortField = 'created_at',
  sortDirection = 'desc',
  dateRange = { from: null, to: null },
}: UseOptimizedOrdersQueryParams) => {
  return useQuery({
    queryKey: ['admin-orders-optimized', statusFilter, searchTerm, page, pageSize, sortField, sortDirection, dateRange],
    queryFn: async (): Promise<OrdersResponse> => {
      const effectivePageSize = Math.min(pageSize, 100);
      const offset = (page - 1) * effectivePageSize;
      
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
            opt_status,
            user_type
          )
        `, { count: 'exact' })
        .range(offset, offset + effectivePageSize - 1);

      // Apply sorting
      if (sortField === 'seller_name') {
        query = query.order('order_seller_name', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'buyer_name') {
        query = query.order('buyer_opt_id', { ascending: sortDirection === 'asc' });
      } else {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
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
          description: `Не удалось загрузить заказы${process.env.NODE_ENV === 'development' ? `: ${error.message}` : ''}`,
          variant: "destructive",
        });
        prodError(new Error("Ошибка загрузки заказов"), {
          context: 'useOptimizedOrdersQuery',
          error: error.message
        });
        throw error;
      }

      const totalCount = count || 0;
      const hasNextPage = offset + effectivePageSize < totalCount;
      const hasPreviousPage = page > 1;

      return {
        data: data as Order[],
        totalCount,
        hasNextPage,
        hasPreviousPage
      };
    },
    staleTime: 1000 * 60, // 1 минута
    gcTime: 1000 * 60 * 5, // 5 минут
  });
};
