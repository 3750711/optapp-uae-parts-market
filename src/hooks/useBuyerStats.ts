import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BuyerStats {
  activeOrders: number;
  notifications: number;
  totalOrders: number;
  pendingOrders: number;
}

export const useBuyerStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buyer-stats', user?.id],
    queryFn: async (): Promise<BuyerStats> => {
      if (!user?.id) {
        return {
          activeOrders: 0,
          notifications: 0,
          totalOrders: 0,
          pendingOrders: 0
        };
      }

      // Get orders count
      const { data: orders } = await supabase
        .from('orders')
        .select('status')
        .eq('buyer_id', user.id);

      // Get notifications count
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false);

      const totalOrders = orders?.length || 0;
      const activeOrders = orders?.filter(order => 
        ['created', 'confirmed', 'in_progress'].includes(order.status)
      ).length || 0;
      const pendingOrders = orders?.filter(order => 
        order.status === 'created'
      ).length || 0;

      return {
        activeOrders,
        notifications: notifications?.length || 0,
        totalOrders,
        pendingOrders
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    retry: 1
  });
};