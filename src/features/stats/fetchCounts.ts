import { supabase } from '@/integrations/supabase/client';
import { safeGetItem } from '@/utils/localStorage';

export async function fetchCounts() {
  try {
    const partsResult = await supabase.from('products').select('*', { head: true, count: 'planned' });
    const ordersResult = await supabase.from('orders').select('id', { head: true, count: 'planned' });
    
    return { 
      parts: partsResult?.count ?? 0, 
      orders: ordersResult?.count ?? 0 
    };
  } catch (error) {
    console.warn('Failed to fetch counts:', error);
    // Return cached data or defaults on error
    return safeGetItem('counts_cache', { parts: 0, orders: 0 });
  }
}