import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config.ts';
import { verifyAuthentication } from './auth-utils.ts';
import { sendAdminNotifications } from './notification-service.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get('authorization') || '';
    
    // Verify user authentication
    const { user, profile } = await verifyAuthentication(supabase, authHeader);
    console.log(`✅ [AdminNotification] User verified: ${user.email} (${profile.user_type})`);
    
    const { productId } = await req.json();
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify product exists and has pending status
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, status, seller_id, title')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('❌ [AdminNotification] Product not found:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (product.status !== 'pending') {
      console.log(`⚠️ [AdminNotification] Product ${productId} status is ${product.status}, not pending - skipping notification`);
      return new Response(
        JSON.stringify({ message: 'Product is not pending, notification skipped' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications
    const result = await sendAdminNotifications(productId, supabase, user);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [AdminNotification] Error:', error);
    
    if (error instanceof Error && (error.message.includes('Authorization header is required') || error.message.includes('Invalid or expired token'))) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
