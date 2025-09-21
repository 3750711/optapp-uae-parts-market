import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createEdgeFunctionClient } from '../_shared/client.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Создаем Supabase клиент с service role
    const supabase = createEdgeFunctionClient(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // Проверяем валидность токена
    const { data: store, error } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        description,
        seller_id,
        address,
        phone,
        verified,
        tags,
        public_share_enabled,
        public_share_expires_at,
        created_at
      `)
      .eq('public_share_token', token)
      .eq('public_share_enabled', true)
      .gt('public_share_expires_at', new Date().toISOString())
      .single();

    if (error) {
      console.error('Store lookup error:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!store) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Получаем информацию о продавце
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('full_name, opt_id, company_name, rating, verification_status')
      .eq('id', store.seller_id)
      .single();

    if (sellerError) {
      console.error('Seller lookup error:', sellerError);
    }

    // Логируем доступ
    try {
      await supabase
        .from('store_public_access_logs')
        .insert({
          store_id: store.id,
          accessed_at: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
          referer: req.headers.get('referer')
        });
    } catch (logError) {
      console.error('Failed to log access:', logError);
      // Не блокируем запрос из-за ошибки логирования
    }

    return new Response(
      JSON.stringify({ 
        store: {
          ...store,
          seller: seller || null
        },
        valid: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});