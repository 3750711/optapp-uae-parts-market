
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useBuyerOrders = () => {
  const { user, profile } = useAuth();
  const isSeller = profile?.user_type === 'seller';

  console.log('🔍 useBuyerOrders hook:', {
    userId: user?.id,
    userType: profile?.user_type,
    isSeller,
    profileExists: !!profile
  });

  return useQuery({
    queryKey: ['buyer-orders', user?.id, isSeller],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID found');
        return [];
      }

      console.log('🔍 Starting orders fetch for user:', user.id);
      
      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            products (
              lot_number
            ),
            seller:profiles!orders_seller_id_fkey (
              phone,
              telegram,
              opt_id
            )
          `);

        // Add proper filtering based on user type
        if (isSeller) {
          console.log('🔍 Fetching orders for seller:', user.id);
          query = query.eq('seller_id', user.id);
        } else {
          console.log('🔍 Fetching orders for buyer:', user.id);
          query = query.eq('buyer_id', user.id);
        }
        
        const { data: ordersData, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Error fetching orders:', error);
          throw error;
        }

        console.log('✅ Orders fetched successfully:', {
          count: ordersData?.length || 0,
          orders: ordersData
        });

        // Fetch confirmation images for each order
        const ordersWithConfirmations = await Promise.all((ordersData || []).map(async (order) => {
          try {
            const { data: confirmImages, error: confirmError } = await supabase
              .from('confirm_images')
              .select('url')
              .eq('order_id', order.id);

            if (confirmError) {
              console.error('⚠️ Error fetching confirm images for order:', order.id, confirmError);
            }
            
            return {
              ...order,
              hasConfirmImages: confirmImages && confirmImages.length > 0
            };
          } catch (err) {
            console.error('⚠️ Error processing order:', order.id, err);
            return {
              ...order,
              hasConfirmImages: false
            };
          }
        }));

        console.log('✅ Orders with confirmations processed:', ordersWithConfirmations.length);
        return ordersWithConfirmations;
        
      } catch (err) {
        console.error('❌ Critical error in orders fetch:', err);
        throw err;
      }
    },
    enabled: !!user && !!profile, // Ensure both user and profile are loaded
    staleTime: 15000,
    retry: 2,
    retryDelay: 1000
  });
};
