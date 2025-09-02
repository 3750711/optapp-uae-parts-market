import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client without auth requirements
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('📊 Fetching public statistics');

    // Use the security definer function for reliable statistics
    const { data, error } = await supabase.rpc('get_public_statistics');

    if (error) {
      console.error('❌ Statistics RPC error:', error);
      
      // Fallback to individual queries if RPC fails
      const [productsResult, sellersResult, ordersResult] = await Promise.allSettled([
        supabase.from('products').select('*', { count: 'estimated', head: true }).in('status', ['active', 'sold']),
        supabase.from('profiles').select('*', { count: 'estimated', head: true }).eq('user_type', 'seller').eq('verification_status', 'verified'),
        supabase.from('orders').select('order_number').order('order_number', { ascending: false }).limit(1).maybeSingle()
      ]);

      const fallbackStats = {
        totalProducts: productsResult.status === 'fulfilled' ? (productsResult.value.count || 1373) : 1373,
        totalSellers: sellersResult.status === 'fulfilled' ? (sellersResult.value.count || 156) : 156,
        lastOrderNumber: ordersResult.status === 'fulfilled' ? (ordersResult.value.data?.order_number || 7774) : 7774
      };

      console.log('📊 Using fallback statistics:', fallbackStats);

      return new Response(JSON.stringify(fallbackStats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Statistics fetched successfully:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Statistics function error:', error);
    
    // Final fallback data
    const hardcodedStats = {
      totalProducts: 1373,
      totalSellers: 156,
      lastOrderNumber: 7774
    };

    return new Response(JSON.stringify(hardcodedStats), {
      status: 200, // Always return 200 for statistics
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});