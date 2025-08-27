import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OrderMediaPayload {
  order_id: string;
  file_url: string;
  file_type: 'photo';
  uploaded_by?: number; // telegram user_id
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    const payload: OrderMediaPayload = await req.json();
    const { order_id, file_url, file_type, uploaded_by } = payload;

    // Validate required fields
    if (!order_id || !file_url || file_type !== 'photo') {
      return new Response(
        JSON.stringify({ 
          error: 'Missing or invalid fields. Required: order_id, file_url, file_type (must be "photo")' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert order media record
    const { data, error } = await supabase
      .from('order_media')
      .insert({
        order_id,
        file_url,
        file_type,
        uploaded_by,
        source: 'telegram'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save media to database' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});