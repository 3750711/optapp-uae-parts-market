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
        // Helper functions for search processing
        const escapePostgRESTTerm = (term: string): string => {
          return term.replace(/[%_]/g, '\\$&');
        };

        const normalizeText = (text: string): string => {
          return text.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
        };

        // Process search term
        const normalizedSearchTerm = normalizeText(searchTerm.toLowerCase().trim());
        const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 0);

        console.log('🔍 Orders Search Debug:', {
          originalTerm: searchTerm,
          normalizedTerm: normalizedSearchTerm,
          searchWords,
          wordCount: searchWords.length
        });

        if (searchWords.length === 1) {
          // Single word search - OR across all fields
          const word = escapePostgRESTTerm(searchWords[0]);
          const isNumeric = !isNaN(Number(word));
          
          if (isNumeric) {
            // For numeric words, search in both text fields and exact numeric matches
            query = query.or(
              `order_number.eq.${Number(word)},` +
              `lot_number_order.eq.${Number(word)},` +
              `place_number.eq.${Number(word)},` +
              `title.ilike.%${word}%,` +
              `brand.ilike.%${word}%,` +
              `model.ilike.%${word}%,` +
              `buyer_opt_id.ilike.%${word}%,` +
              `seller_opt_id.ilike.%${word}%,` +
              `order_seller_name.ilike.%${word}%,` +
              `container_number.ilike.%${word}%,` +
              `text_order.ilike.%${word}%`
            );
          } else {
            // For text words, search only in text fields
            query = query.or(
              `title.ilike.%${word}%,` +
              `brand.ilike.%${word}%,` +
              `model.ilike.%${word}%,` +
              `buyer_opt_id.ilike.%${word}%,` +
              `seller_opt_id.ilike.%${word}%,` +
              `order_seller_name.ilike.%${word}%,` +
              `container_number.ilike.%${word}%,` +
              `text_order.ilike.%${word}%`
            );
          }

          console.log('🔍 Single word search applied:', { word, isNumeric });
        } else {
          // Multiple words - AND logic between words, OR within each word across fields
          const wordConditions = searchWords.map(word => {
            const escapedWord = escapePostgRESTTerm(word);
            const isNumeric = !isNaN(Number(escapedWord));
            
            if (isNumeric) {
              return `order_number.eq.${Number(escapedWord)},` +
                     `lot_number_order.eq.${Number(escapedWord)},` +
                     `place_number.eq.${Number(escapedWord)},` +
                     `title.ilike.%${escapedWord}%,` +
                     `brand.ilike.%${escapedWord}%,` +
                     `model.ilike.%${escapedWord}%,` +
                     `buyer_opt_id.ilike.%${escapedWord}%,` +
                     `seller_opt_id.ilike.%${escapedWord}%,` +
                     `order_seller_name.ilike.%${escapedWord}%,` +
                     `container_number.ilike.%${escapedWord}%,` +
                     `text_order.ilike.%${escapedWord}%`;
            } else {
              return `title.ilike.%${escapedWord}%,` +
                     `brand.ilike.%${escapedWord}%,` +
                     `model.ilike.%${escapedWord}%,` +
                     `buyer_opt_id.ilike.%${escapedWord}%,` +
                     `seller_opt_id.ilike.%${escapedWord}%,` +
                     `order_seller_name.ilike.%${escapedWord}%,` +
                     `container_number.ilike.%${escapedWord}%,` +
                     `text_order.ilike.%${escapedWord}%`;
            }
          });

          // Apply AND logic: wrap each word condition in or(), then chain with and()
          const orConditions = wordConditions.map(condition => `or(${condition})`);
          const finalCondition = `and(${orConditions.join(',')})`;
          
          query = query.or(finalCondition);

          console.log('🔍 Multi-word search applied:', {
            wordConditions: wordConditions.length,
            finalCondition: finalCondition.substring(0, 100) + '...'
          });
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
    staleTime: 5 * 60 * 1000, // 5 минут для админских данных
    gcTime: 10 * 60 * 1000, // 10 минут
    refetchOnWindowFocus: false, // отключаем рефетч по фокусу в админке
  });
};
