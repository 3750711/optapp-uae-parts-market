import { supabase } from '@/integrations/supabase/client';

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
    const cached = localStorage.getItem('counts_cache');
    return cached ? JSON.parse(cached) : { parts: 0, orders: 0 };
  }
}